import { Job as BullJob } from 'bullmq'
import { AtsScreeningJobData } from '../queues/index.js'
import { Candidate, AuditLog, Job as JobModel } from '../../database/models/index.js'
import { ResumeProfile } from '../../modules/ats-screening/models/resume-profile.model.js'
import { JobScreeningProfile } from '../../modules/ats-screening/models/job-screening-profile.model.js'
import {
    ScreeningResult,
    ScreeningStatus,
    deriveStatusPriority,
} from '../../modules/ats-screening/models/screening-result.model.js'
import { ScoringEngineRegistry } from '../../modules/ats-screening/scoring-registry.js'
import { isParsedDataValid, atsLogContext } from '../../modules/ats-screening/ats-parse-guard.js'
import { fluxEvents, DomainEvent } from '../../common/services/events.service.js'
import { V2JobContext } from '../../modules/ats-screening/scoring-v2/types.js'
import { embeddingService } from '../../modules/ats-screening/scoring-v2/embedding.service.js'
import {
    DEFAULT_SCORING_CONFIG,
    fromLegacyProfile,
    toLegacyWeights,
    toLegacyWeightsV2,
    type IScoringConfig,
} from '../../modules/ats-screening/scoring-config.types.js'
import { copilotService } from '../../modules/ats-screening/copilot.service.js'

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const DEFAULT_SCORING_VERSION = '2.0.0'

/** Maximum BullMQ retry attempts configured on the ats-screening queue. */
const MAX_ATTEMPTS = 5

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/**
 * Resolve the scoring config for a job.
 *
 * Priority:
 * 1. job.scoringConfig (new — single source of truth)
 * 2. JobScreeningProfile (legacy — for unmigrated jobs)
 * 3. DEFAULT_SCORING_CONFIG (absolute fallback)
 */
async function resolveJobScoringConfig(
    jobDoc: Awaited<ReturnType<typeof JobModel.findById>>,
    jobId: string,
    organizationId: string,
    logCtx: object,
): Promise<IScoringConfig> {
    // Priority 1: Job.scoringConfig (post-migration)
    const jobScoringConfig = (jobDoc as any)?.scoringConfig
    if (jobScoringConfig?.thresholds) {
        return jobScoringConfig as IScoringConfig
    }

    // Priority 2: Legacy JobScreeningProfile (pre-migration fallback)
    const legacyProfile = await JobScreeningProfile.findOne({ jobId, organizationId })
    if (legacyProfile) {
        console.warn(
            `[ATS Screening] Job.scoringConfig missing — falling back to legacy JobScreeningProfile. ` +
            `Run migrate-scoring-config.ts to fix.`,
            logCtx,
        )
        return fromLegacyProfile(legacyProfile)
    }

    // Priority 3: Default
    console.warn(`[ATS Screening] No scoring config found — using defaults`, logCtx)
    return { ...DEFAULT_SCORING_CONFIG }
}

/** Map IScoringConfig → ScoreConfig for the scoring engine (handles old vs new weight naming). */
function buildScoreConfig(scoringConfig: IScoringConfig): import('../../modules/ats-screening/scoring-registry.js').ScoreConfig {
    const { weights } = scoringConfig
    return {
        weights: {
            skillWeight:      weights.skills,
            experienceWeight: weights.experience,
            projectWeight:    weights.projects,
            educationWeight:  weights.education,
            // Always include both so V1 and V2 engines are both satisfied
            bonusWeight:       weights.signalBoost,
            signalBoostWeight: weights.signalBoost,
        },
        hardGates: {
            minimumSkills:          scoringConfig.hardGates.requiredSkills,
            minimumExperienceYears: scoringConfig.hardGates.minimumExperienceYears,
            requiredEducationLevel: scoringConfig.hardGates.requiredEducationLevel,
        },
    }
}

// ─────────────────────────────────────────────
// Processor
// ─────────────────────────────────────────────

export async function processAtsScreeningJob(job: BullJob<AtsScreeningJobData>) {
    const { candidateId, jobId, organizationId, applicationId } = job.data
    const retryCount = job.attemptsMade   // 0-based; 0 = first attempt

    const logCtx = atsLogContext({ candidateId, jobId, organizationId, retryCount })

    console.log(`[ATS Screening] Starting | attempt=${retryCount + 1}/${MAX_ATTEMPTS}`, logCtx)

    try {

        // ── Step 1: Fetch Candidate ───────────────────────────────────────
        const candidate = await Candidate.findById(candidateId)
        if (!candidate) {
            // Hard failure — candidate deleted from DB; do not retry
            console.error(`[ATS Screening] Candidate not found — aborting without retry`, logCtx)
            await upsertResult(candidateId, jobId, organizationId, {
                status:         ScreeningStatus.ERROR,
                errorReason:    null,
                statusPriority: deriveStatusPriority(ScreeningStatus.ERROR),
                scoringVersion: DEFAULT_SCORING_VERSION,
            })
            return   // Do NOT throw — avoids unnecessary BullMQ retries for a permanent failure
        }

        // ── Step 2: Mark as SCORING_IN_PROGRESS (idempotent write) ───────
        await upsertResult(candidateId, jobId, organizationId, {
            status:         ScreeningStatus.SCORING_IN_PROGRESS,
            statusPriority: deriveStatusPriority(ScreeningStatus.SCORING_IN_PROGRESS),
            scoringVersion: DEFAULT_SCORING_VERSION,
        })

        // ── Step 3: Check resume parse readiness ─────────────────────────
        const resumeProfile = await ResumeProfile.findOne({ candidateId, organizationId })
        const parsedData    = resumeProfile?.parsedData
        const isParsed      = resumeProfile?.parsedAt != null

        if (!isParsed || !parsedData) {
            if (retryCount === 0 && candidate.resumeUrl) {
                const { enqueueResumeParsingJob } = await import('../queues/index.js')
                console.log(`[ATS Screening] Resume not parsed — enqueuing parse job`, logCtx)
                await enqueueResumeParsingJob({ candidateId, organizationId, resumeUrl: candidate.resumeUrl })
            }

            await upsertResult(candidateId, jobId, organizationId, {
                status:         ScreeningStatus.AWAITING_PARSE,
                statusPriority: deriveStatusPriority(ScreeningStatus.AWAITING_PARSE),
                scoringVersion: DEFAULT_SCORING_VERSION,
            })

            if (retryCount < MAX_ATTEMPTS - 1) {
                console.warn(`[ATS Screening] Resume not ready — will retry (attempt ${retryCount + 1})`, logCtx)
                throw new Error(`Resume not parsed yet. Retry ${retryCount + 1}/${MAX_ATTEMPTS}`)
            } else {
                console.error(`[ATS Screening] Parse retries exhausted — marking PARSE_FAILED`, { ...logCtx, failureReason: 'PARSE_TIMEOUT' })
                await upsertResult(candidateId, jobId, organizationId, {
                    status:         ScreeningStatus.PARSE_FAILED,
                    errorReason:    'PARSE_TIMEOUT',
                    statusPriority: deriveStatusPriority(ScreeningStatus.PARSE_FAILED),
                    scoringVersion: DEFAULT_SCORING_VERSION,
                })
                await emitParseFailedEvent({ organizationId, jobId, candidateId, applicationId, reason: 'PARSE_TIMEOUT' })
                return
            }
        }

        // ── Step 4: Validate completeness of parsed data ─────────────────
        if (!isParsedDataValid(parsedData)) {
            console.error(`[ATS Screening] Parsed data present but invalid — marking PARSE_FAILED`, { ...logCtx, failureReason: 'INVALID_FORMAT' })
            await upsertResult(candidateId, jobId, organizationId, {
                status:         ScreeningStatus.PARSE_FAILED,
                errorReason:    'INVALID_FORMAT',
                statusPriority: deriveStatusPriority(ScreeningStatus.PARSE_FAILED),
                scoringVersion: DEFAULT_SCORING_VERSION,
            })
            await emitParseFailedEvent({ organizationId, jobId, candidateId, applicationId, reason: 'INVALID_FORMAT' })
            return
        }

        // ── Step 5: Load Job + Resolve Scoring Config (SINGLE SOURCE OF TRUTH) ──
        const jobDoc       = await JobModel.findById(jobId)
        const scoringConfig = await resolveJobScoringConfig(jobDoc, jobId, organizationId, logCtx)

        // ── Step 5.5: Build V2 Job Context from Job fields ───────────────
        const jobContext: V2JobContext = {
            jobDescription:        jobDoc?.description || '',
            jobTitle:              jobDoc?.title || '',
            // Skills: read from scoringConfig.hardGates (kept in sync with Job.requiredSkills)
            requiredSkills:        scoringConfig.hardGates.requiredSkills.length > 0
                ? scoringConfig.hardGates.requiredSkills
                : (jobDoc?.requiredSkills ?? []),
            // JD embedding from legacy profile (still cached there until full migration)
            jdEmbedding:           undefined,
            targetExperienceYears: scoringConfig.hardGates.minimumExperienceYears,
            requiredEducationLevel:scoringConfig.hardGates.requiredEducationLevel,
        }

        // Load cached JD embedding from legacy profile (still best place to cache it)
        const legacyProfileForEmbedding = await JobScreeningProfile.findOne({ jobId, organizationId })
        if (legacyProfileForEmbedding?.jdEmbedding?.length) {
            jobContext.jdEmbedding = legacyProfileForEmbedding.jdEmbedding
        }

        // Cache JD embedding lazily if not found
        if (!jobContext.jdEmbedding && jobContext.jobDescription) {
            try {
                const jdEmb = await embeddingService.embed(jobContext.jobDescription)
                jobContext.jdEmbedding = jdEmb
                // Persist to legacy profile (will be moved to Job in future refactor)
                await JobScreeningProfile.findOneAndUpdate(
                    { jobId, organizationId },
                    { $set: { jdEmbedding: jdEmb } },
                    { upsert: true }
                )
                console.log(`[ATS Screening] JD embedding cached for job`, logCtx)
            } catch (embError) {
                console.warn(`[ATS Screening] Failed to compute JD embedding — continuing without`, {
                    ...logCtx,
                    error: embError instanceof Error ? embError.message : String(embError),
                })
            }
        }

        // ── Step 6: Run Scoring Engine ────────────────────────────────────
        const scoringVersion = scoringConfig.version === 'v1' ? '1.0.0' : DEFAULT_SCORING_VERSION
        const engine         = ScoringEngineRegistry.getEngine(scoringVersion)
        const scoreConfig    = buildScoreConfig(scoringConfig)

        const gateResult      = await engine.evaluateHardGates(parsedData, scoreConfig, jobContext)
        const scoreBreakdown  = await engine.generateBreakdown(parsedData, scoreConfig, jobContext)
        const finalScore      = await engine.calculateFinalScore(scoreBreakdown, scoreConfig.weights)
        const confidenceScore = await engine.calculateConfidence(parsedData)

        const resolvedStatus = gateResult.passed ? ScreeningStatus.PASSED : ScreeningStatus.FAILED_GATE

        console.log(
            `[ATS Screening] Scoring complete | score=${finalScore} status=${resolvedStatus}`,
            logCtx
        )

        // Extract V2-specific fields if available
        const v2Breakdown = scoreBreakdown as any
        const insights: string[] = v2Breakdown?.insights || []
        const skillMatchDetails: { skill: string; bestMatch: string; similarity: number }[] =
            (v2Breakdown?.skillMatchDetails || []).map((d: any) => ({
                skill: d.skill,
                bestMatch: d.bestMatch,
                similarity: d.similarity,
            }))

        // ── Step 7: Persist Full Result ───────────────────────────────────
        const screeningResult = await upsertResult(candidateId, jobId, organizationId, {
            status:               resolvedStatus,
            hardGateFailureReason:gateResult.reason,
            errorReason:          null,
            statusPriority:       deriveStatusPriority(resolvedStatus),
            scoreBreakdown,
            finalScore,
            confidenceScore,
            scoringVersion,
            insights,
            skillMatchDetails,
        })

        // ── Step 8: Audit Log ─────────────────────────────────────────────
        await AuditLog.create({
            organizationId,
            entityType: 'SCREENING_RESULT',
            entityId:   screeningResult._id,
            action:     'SCREENING_COMPLETED',
            newValue:   { status: resolvedStatus, finalScore, confidenceScore },
        })

        // ── Step 9: Emit Domain Events ────────────────────────────────────
        const payload = {
            organizationId,
            jobId,
            candidateId,
            entityType: 'SCREENING_RESULT',
            entityId:   screeningResult._id,
            finalScore,
            status:     resolvedStatus,
        }

        fluxEvents.emitDomainEvent(DomainEvent.SCREENING_COMPLETED, payload)

        // Threshold events use job's scoringConfig (not hardcoded values)
        if (finalScore >= scoringConfig.thresholds.shortlist) {
            fluxEvents.emitDomainEvent(DomainEvent.SCREENING_SCORE_ABOVE, payload)
        } else if (
            scoringConfig.thresholds.autoReject > 0 &&
            finalScore <= scoringConfig.thresholds.autoReject
        ) {
            fluxEvents.emitDomainEvent(DomainEvent.SCREENING_SCORE_BELOW, payload)
        }

        console.log(`[ATS Screening] Completed successfully | finalScore=${finalScore}`, logCtx)

        // ── Step 10: Pre-warm Copilot Cache (fire-and-forget) ──────────────
        copilotService.generateCopilotInsights(jobId, organizationId)
            .catch(err => console.warn(`[ATS Screening] Copilot pre-warm failed (non-critical)`, { ...logCtx, error: err instanceof Error ? err.message : String(err) }))

    } catch (error) {
        console.error(
            `[ATS Screening] Worker error | attempt=${retryCount + 1}`,
            { ...logCtx, error: error instanceof Error ? error.message : String(error) }
        )

        if (retryCount >= MAX_ATTEMPTS - 1) {
            await AuditLog.create({
                organizationId,
                entityType: 'SCREENING_RESULT',
                entityId:   candidateId as any,
                action:     'SCREENING_FAILED',
                newValue:   {
                    error:  error instanceof Error ? error.message : String(error),
                    jobId,
                    retryCount,
                },
            }).catch(console.error)

            await upsertResult(candidateId, jobId, organizationId, {
                status:         ScreeningStatus.ERROR,
                errorReason:    null,
                statusPriority: deriveStatusPriority(ScreeningStatus.ERROR),
                scoringVersion: DEFAULT_SCORING_VERSION,
            }).catch(console.error)
        }

        throw error   // Bubble up for BullMQ retry
    }
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/** Idempotent upsert — safe to call multiple times within the same job run. */
async function upsertResult(
    candidateId: string,
    jobId: string,
    organizationId: string,
    fields: Record<string, unknown>
) {
    return ScreeningResult.findOneAndUpdate(
        { candidateId, jobId, organizationId },
        { $set: fields },
        { new: true, upsert: true }
    )
}

/** Emits the RESUME_PARSE_FAILED domain event and writes an audit record. */
async function emitParseFailedEvent(params: {
    organizationId: string
    jobId: string
    candidateId: string
    applicationId: string
    reason: string
}) {
    const { organizationId, jobId, candidateId, applicationId, reason } = params

    fluxEvents.emitDomainEvent(DomainEvent.RESUME_PARSE_FAILED as any, {
        organizationId,
        jobId,
        candidateId,
        applicationId,
        reason,
    })

    await AuditLog.create({
        organizationId,
        entityType: 'SCREENING_RESULT',
        entityId:   candidateId as any,
        action:     'RESUME_PARSE_FAILED',
        newValue:   { reason, jobId },
    }).catch(console.error)
}
