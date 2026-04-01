/**
 * ATS Re-Scoring Processor
 *
 * Triggered when a Job's scoring configuration changes (skills updated, weights changed, etc).
 * Re-scores all existing candidates for the affected job in batches.
 *
 * Design principles:
 * - Idempotent: safe to run multiple times
 * - Batched: processes 100 candidates at a time
 * - Non-blocking: individual batch failures don't abort the entire job
 * - bulkWrite: single DB round-trip per batch
 */

import { Job as BullMQJob } from 'bullmq'
import { AtsRescoringJobData } from '../queues/index.js'
import { Candidate, AuditLog, Job as JobModel } from '../../database/models/index.js'
import { ScreeningResult, ScreeningStatus, deriveStatusPriority } from '../../modules/ats-screening/models/screening-result.model.js'
import { ResumeProfile } from '../../modules/ats-screening/models/resume-profile.model.js'
import { JobScreeningProfile } from '../../modules/ats-screening/models/job-screening-profile.model.js'
import { ScoringEngineRegistry } from '../../modules/ats-screening/scoring-registry.js'
import { isParsedDataValid } from '../../modules/ats-screening/ats-parse-guard.js'
import { fluxEvents, DomainEvent } from '../../common/services/events.service.js'
import { V2JobContext } from '../../modules/ats-screening/scoring-v2/types.js'
import {
    DEFAULT_SCORING_CONFIG,
    fromLegacyProfile,
    toLegacyWeights,
    toLegacyWeightsV2,
    type IScoringConfig,
} from '../../modules/ats-screening/scoring-config.types.js'

// ──────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────

const BATCH_SIZE          = 100
const DEFAULT_VERSION     = '2.0.0'

// ──────────────────────────────────────────────────────────────
// Main processor
// ──────────────────────────────────────────────────────────────

export async function processAtsRescoringJob(job: BullMQJob<AtsRescoringJobData>) {
    const { jobId, organizationId, reason } = job.data

    console.log(`[ATS Re-scoring] Starting | jobId=${jobId} reason=${reason}`)

    // ── Load Job + Scoring Config ─────────────────────────────────────
    const jobDoc = await JobModel.findById(jobId)
    if (!jobDoc) {
        console.error(`[ATS Re-scoring] Job not found — aborting | jobId=${jobId}`)
        return
    }

    // Resolve scoring config
    let scoringConfig: IScoringConfig
    if (jobDoc.scoringConfig?.thresholds) {
        scoringConfig = jobDoc.scoringConfig as IScoringConfig
    } else {
        // Legacy fallback
        const legacyProfile = await JobScreeningProfile.findOne({ jobId, organizationId })
        scoringConfig = legacyProfile ? fromLegacyProfile(legacyProfile) : { ...DEFAULT_SCORING_CONFIG }
        console.warn(`[ATS Re-scoring] Using legacy profile fallback for job=${jobId}`)
    }

    const isV2 = scoringConfig.version !== 'v1'
    const scoringVersion = isV2 ? DEFAULT_VERSION : '1.0.0'
    const engine         = ScoringEngineRegistry.getEngine(scoringVersion)
    const scoreConfig = {
        weights: {
            skillWeight:       scoringConfig.weights.skills,
            experienceWeight:  scoringConfig.weights.experience,
            projectWeight:     scoringConfig.weights.projects,
            educationWeight:   scoringConfig.weights.education,
            bonusWeight:       scoringConfig.weights.signalBoost,
            signalBoostWeight: scoringConfig.weights.signalBoost,
        },
        hardGates: {
            minimumSkills:          scoringConfig.hardGates.requiredSkills,
            minimumExperienceYears: scoringConfig.hardGates.minimumExperienceYears,
            requiredEducationLevel: scoringConfig.hardGates.requiredEducationLevel,
        },
    }

    // Load JD embedding for V2 (cached in legacy profile)
    const legacyProfileForEmb = await JobScreeningProfile.findOne({ jobId, organizationId })
    const jdEmbedding = legacyProfileForEmb?.jdEmbedding ?? undefined

    const jobContext: V2JobContext = {
        jobDescription:         jobDoc.description || '',
        jobTitle:               jobDoc.title || '',
        requiredSkills:         scoringConfig.hardGates.requiredSkills.length > 0
            ? scoringConfig.hardGates.requiredSkills
            : (jobDoc.requiredSkills ?? []),
        jdEmbedding,
        targetExperienceYears:  scoringConfig.hardGates.minimumExperienceYears,
        requiredEducationLevel: scoringConfig.hardGates.requiredEducationLevel,
    }

    // ── Identify candidates to re-score ──────────────────────────────
    // Only re-score candidates that have been previously scored (not awaiting parse / errored)
    const scorableStatuses = [ScreeningStatus.PASSED, 'SCORED', ScreeningStatus.FAILED_GATE]
    const total = await ScreeningResult.countDocuments({
        jobId,
        organizationId,
        status: { $in: scorableStatuses },
    })

    console.log(`[ATS Re-scoring] ${total} scorable results to process | jobId=${jobId}`)

    if (total === 0) {
        console.log(`[ATS Re-scoring] No results to re-score — done`)
        return
    }

    // ── Batch processing ──────────────────────────────────────────────
    let processed = 0
    let successCount = 0
    let errorCount = 0

    while (processed < total) {
        const batch = await ScreeningResult.find({
            jobId,
            organizationId,
            status: { $in: scorableStatuses },
        })
            .skip(processed)
            .limit(BATCH_SIZE)
            .lean()

        if (batch.length === 0) break

        const bulkOps: any[] = []

        await Promise.allSettled(
            batch.map(async (result) => {
                try {
                    const candidateId = result.candidateId.toString()

                    // Load resume profile
                    const resumeProfile = await ResumeProfile.findOne({
                        candidateId: result.candidateId,
                        organizationId,
                    }).lean()

                    const parsedData = resumeProfile?.parsedData
                    if (!parsedData || !isParsedDataValid(parsedData)) {
                        // Skip un-parsable — don't change their status during re-score
                        return
                    }

                    // Run scoring
                    const gateResult      = await engine.evaluateHardGates(parsedData, scoreConfig, jobContext)
                    const scoreBreakdown  = await engine.generateBreakdown(parsedData, scoreConfig, jobContext)
                    const finalScore      = await engine.calculateFinalScore(scoreBreakdown, scoreConfig.weights)
                    const confidenceScore = await engine.calculateConfidence(parsedData)

                    const resolvedStatus = gateResult.passed ? ScreeningStatus.PASSED : ScreeningStatus.FAILED_GATE

                    const v2Breakdown = scoreBreakdown as any
                    const insights: string[]         = v2Breakdown?.insights || []
                    const skillMatchDetails: any[]   = (v2Breakdown?.skillMatchDetails || [])

                    bulkOps.push({
                        updateOne: {
                            filter: { _id: result._id },
                            update: {
                                $set: {
                                    status:                resolvedStatus,
                                    statusPriority:        deriveStatusPriority(resolvedStatus),
                                    hardGateFailureReason: gateResult.reason,
                                    scoreBreakdown,
                                    finalScore,
                                    confidenceScore,
                                    scoringVersion,
                                    insights,
                                    skillMatchDetails,
                                    rescoredAt: new Date(),
                                }
                            }
                        }
                    })

                    successCount++
                } catch (err) {
                    errorCount++
                    console.error(`[ATS Re-scoring] Failed for result=${result._id}:`, err)
                }
            })
        )

        // Execute batch bulkWrite
        if (bulkOps.length > 0) {
            try {
                await ScreeningResult.bulkWrite(bulkOps, { ordered: false })
            } catch (bulkErr) {
                console.error(`[ATS Re-scoring] bulkWrite error for batch at offset=${processed}:`, bulkErr)
                errorCount += bulkOps.length
            }
        }

        processed += batch.length
        console.log(`[ATS Re-scoring] Progress: ${processed}/${total} | success=${successCount} errors=${errorCount}`)
    }

    // ── Audit log ─────────────────────────────────────────────────────
    await AuditLog.create({
        organizationId,
        entityType: 'JOB',
        entityId:   jobId as any,
        action:     'RESCORING_COMPLETED',
        newValue:   { total, successCount, errorCount, reason },
    }).catch(console.error)

    // ── Emit completion event ─────────────────────────────────────────
    fluxEvents.emitDomainEvent(DomainEvent.RESCORING_COMPLETED as any, {
        organizationId,
        jobId,
        total,
        successCount,
        errorCount,
        reason,
    })

    console.log(
        `[ATS Re-scoring] Complete | jobId=${jobId} total=${total} success=${successCount} errors=${errorCount}`
    )
}
