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

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const DEFAULT_SCORING_VERSION = '2.0.0'

/** Maximum BullMQ retry attempts configured on the ats-screening queue. */
const MAX_ATTEMPTS = 5

/**
 * Default screening profile weights applied when no JobScreeningProfile
 * has been explicitly configured by the recruiter.
 *
 * V2 defaults: skill-heavy, no bonus abuse
 */
const DEFAULT_WEIGHTS = {
    skillWeight:      0.35,
    experienceWeight: 0.30,
    projectWeight:    0.20,
    educationWeight:  0.10,
    bonusWeight:      0.05,
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
        // This ensures the dashboard accurately reflects in-flight work,
        // and also makes the job retry-safe (subsequent upserts will overwrite).
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
            // Resume has not been parsed yet.
            if (retryCount === 0 && candidate.resumeUrl) {
                // First attempt: Kick off the resume parsing job if not already in flight.
                // We don't enqueue on every retry to avoid duplicate parse jobs in the queue.
                const { enqueueResumeParsingJob } = await import('../queues/index.js')
                console.log(`[ATS Screening] Resume not parsed — enqueuing parse job`, logCtx)
                await enqueueResumeParsingJob({ candidateId, organizationId, resumeUrl: candidate.resumeUrl })
            }

            // Set status to AWAITING_PARSE and throw to trigger BullMQ's
            // built-in exponential backoff retry.
            await upsertResult(candidateId, jobId, organizationId, {
                status:         ScreeningStatus.AWAITING_PARSE,
                statusPriority: deriveStatusPriority(ScreeningStatus.AWAITING_PARSE),
                scoringVersion: DEFAULT_SCORING_VERSION,
            })

            if (retryCount < MAX_ATTEMPTS - 1) {
                // Retry is still available — throw so BullMQ re-queues with backoff
                console.warn(`[ATS Screening] Resume not ready — will retry (attempt ${retryCount + 1})`, logCtx)
                throw new Error(`Resume not parsed yet. Retry ${retryCount + 1}/${MAX_ATTEMPTS}`)
            } else {
                // Retries exhausted — permanently mark as PARSE_FAILED, do NOT score
                console.error(
                    `[ATS Screening] Parse retries exhausted — marking PARSE_FAILED`,
                    { ...logCtx, failureReason: 'PARSE_TIMEOUT' }
                )
                await upsertResult(candidateId, jobId, organizationId, {
                    status:         ScreeningStatus.PARSE_FAILED,
                    errorReason:    'PARSE_TIMEOUT',
                    statusPriority: deriveStatusPriority(ScreeningStatus.PARSE_FAILED),
                    scoringVersion: DEFAULT_SCORING_VERSION,
                })
                await emitParseFailedEvent({ organizationId, jobId, candidateId, applicationId, reason: 'PARSE_TIMEOUT' })
                return   // Exit cleanly — no scoring, no retry
            }
        }

        // ── Step 4: Validate completeness of parsed data ─────────────────
        if (!isParsedDataValid(parsedData)) {
            console.error(
                `[ATS Screening] Parsed data present but invalid — marking PARSE_FAILED`,
                { ...logCtx, failureReason: 'INVALID_FORMAT' }
            )
            await upsertResult(candidateId, jobId, organizationId, {
                status:         ScreeningStatus.PARSE_FAILED,
                errorReason:    'INVALID_FORMAT',
                statusPriority: deriveStatusPriority(ScreeningStatus.PARSE_FAILED),
                scoringVersion: DEFAULT_SCORING_VERSION,
            })
            await emitParseFailedEvent({ organizationId, jobId, candidateId, applicationId, reason: 'INVALID_FORMAT' })
            return   // No scoring
        }

        // ── Step 5: Load (or create) JobScreeningProfile ─────────────────
        let jobProfile = await JobScreeningProfile.findOne({ jobId, organizationId })
        if (!jobProfile) {
            console.log(`[ATS Screening] No JobScreeningProfile found — using V2 defaults`, logCtx)
            jobProfile = new JobScreeningProfile({
                jobId,
                organizationId,
                hardGates: {},
                weights:   DEFAULT_WEIGHTS,
                thresholds: { shortlist: 80, reviewZone: 60, autoReject: 0 },
            })
        }

        // ── Step 5.5: Build V2 Job Context ───────────────────────────────
        const jobDoc = await JobModel.findById(jobId)
        const jobContext: V2JobContext = {
            jobDescription:        jobDoc?.description || '',
            jobTitle:              jobDoc?.title || '',
            requiredSkills:        jobDoc?.requiredSkills || jobProfile.hardGates.minimumSkills || [],
            jdEmbedding:           jobProfile.jdEmbedding || undefined,
            targetExperienceYears: jobProfile.hardGates.minimumExperienceYears || 0,
            requiredEducationLevel:jobProfile.hardGates.requiredEducationLevel,
        }

        // Cache JD embedding lazily (compute once per job, store in profile)
        if (!jobContext.jdEmbedding && jobContext.jobDescription) {
            try {
                const jdEmb = await embeddingService.embed(jobContext.jobDescription)
                jobContext.jdEmbedding = jdEmb
                // Persist to avoid recomputing for next candidate
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
        // Determine scoring version from job profile (defaults to V2)
        const scoringVersion = jobProfile.scoringVersion === 'v1' ? '1.0.0' : DEFAULT_SCORING_VERSION
        const engine   = ScoringEngineRegistry.getEngine(scoringVersion)
        const config   = { weights: jobProfile.weights, hardGates: jobProfile.hardGates }

        const gateResult     = await engine.evaluateHardGates(parsedData, config, jobContext)
        const scoreBreakdown = await engine.generateBreakdown(parsedData, config, jobContext)
        const finalScore     = await engine.calculateFinalScore(scoreBreakdown, jobProfile.weights)
        const confidenceScore= await engine.calculateConfidence(parsedData)

        // Map gate result to legacy status values so existing API consumers
        // (frontend decision badges, reporting queries) continue working unchanged.
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
            errorReason:          null,  // Clear any prior parse error
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

        if (jobProfile.thresholds) {
            if (finalScore >= jobProfile.thresholds.shortlist) {
                fluxEvents.emitDomainEvent(DomainEvent.SCREENING_SCORE_ABOVE, payload)
            } else if (
                jobProfile.thresholds.autoReject > 0 &&
                finalScore <= jobProfile.thresholds.autoReject
            ) {
                fluxEvents.emitDomainEvent(DomainEvent.SCREENING_SCORE_BELOW, payload)
            }
        }

        console.log(`[ATS Screening] Completed successfully | finalScore=${finalScore}`, logCtx)

    } catch (error) {
        // Structured error log with context
        console.error(
            `[ATS Screening] Worker error | attempt=${retryCount + 1}`,
            { ...logCtx, error: error instanceof Error ? error.message : String(error) }
        )

        // On final retry failure — write an ERROR record in the DB for visibility
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
