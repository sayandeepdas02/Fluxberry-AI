import { Job } from 'bullmq'
import { AtsScreeningJobData, enqueueResumeParsingJob } from '../queues/index.js'
import { Candidate, AuditLog } from '../../database/models/index.js'
import { ResumeProfile } from '../../modules/ats-screening/models/resume-profile.model.js'
import { JobScreeningProfile } from '../../modules/ats-screening/models/job-screening-profile.model.js'
import { ScreeningResult } from '../../modules/ats-screening/models/screening-result.model.js'
import { ScoringEngineRegistry } from '../../modules/ats-screening/scoring-registry.js'
import { fluxEvents, DomainEvent } from '../../common/services/events.service.js'

const SCORING_VERSION = '2.0.0'

export async function processAtsScreeningJob(job: Job<AtsScreeningJobData>) {
    const { candidateId, jobId, organizationId, applicationId } = job.data

    try {
        console.log(`[ATS Screening] Starting screening for candidate ${candidateId} on job ${jobId}`)

        // 1. Fetch Candidate
        const candidate = await Candidate.findById(candidateId)
        if (!candidate) {
            throw new Error(`Candidate ${candidateId} not found`)
        }

        // 2. Fetch JobScreeningProfile
        let jobProfile = await JobScreeningProfile.findOne({ jobId, organizationId })
        if (!jobProfile) {
            // Provide a default profile if not configured, or could throw to require configuration
            console.log(`[ATS Screening] No JobScreeningProfile found for job ${jobId}. Using default weights.`)
            jobProfile = new JobScreeningProfile({
                jobId,
                organizationId,
                hardGates: {},
                weights: {
                    skillWeight: 0.4,
                    experienceWeight: 0.3,
                    projectWeight: 0.1,
                    educationWeight: 0.1,
                    bonusWeight: 0.1,
                },
                thresholds: {
                    shortlist: 80,
                    reviewZone: 60,
                    autoReject: 0,
                }
            })
        }

        // 3. Check ResumeProfile
        let resumeProfile = await ResumeProfile.findOne({ candidateId, organizationId })

        if (!resumeProfile || !resumeProfile.parsedAt) {
            // Queue resume parsing async if missing and we haven't tried recently
            if (job.attemptsMade === 0 && candidate.resumeUrl) {
                console.log(`[ATS Screening] Enqueuing raw resume parsing for ${candidateId}`)
                await enqueueResumeParsingJob({
                    candidateId,
                    organizationId,
                    resumeUrl: candidate.resumeUrl
                })
            }
            // Throw to trigger BullMQ retry logic
            if (job.attemptsMade < (job.opts.attempts || 3)) {
                throw new Error('Resume not parsed yet. Retrying...')
            } else {
                console.warn(`[ATS Screening] Max retries reached for ${candidateId}. Scoring with empty data.`)
            }
        }

        const parsedData = resumeProfile?.parsedData

        // 4. Retrieve ATS Scoring Engine Strategy
        const engine = ScoringEngineRegistry.getEngine(SCORING_VERSION)
        const config = { weights: jobProfile.weights, hardGates: jobProfile.hardGates }

        // 5. Apply HardGate
        const gateResult = engine.evaluateHardGates(parsedData, config)
        let status: 'PASSED' | 'FAILED_GATE' | 'PENDING' | 'ERROR' = gateResult.passed ? 'PASSED' : 'FAILED_GATE'

        // 6. Compute Component Scores
        const scoreBreakdown = engine.generateBreakdown(parsedData, config)

        // 7. Compute Final Weighted Score
        const finalScore = engine.calculateFinalScore(scoreBreakdown, jobProfile.weights)

        // 8. Compute Confidence Score
        const confidenceScore = engine.calculateConfidence(parsedData)

        // 8. Save ScreeningResult
        const screeningResult = await ScreeningResult.findOneAndUpdate(
            { candidateId, jobId, organizationId },
            {
                status,
                hardGateFailureReason: gateResult.reason,
                scoreBreakdown,
                finalScore,
                confidenceScore,
                scoringVersion: SCORING_VERSION
            },
            { new: true, upsert: true }
        )

        // 9. Emit SCREENING_COMPLETED via Audit or separate queue if needed
        await AuditLog.create({
            organizationId,
            entityType: 'SCREENING_RESULT',
            entityId: screeningResult._id,
            action: 'SCREENING_COMPLETED',
            newValue: {
                status,
                finalScore,
                confidenceScore
            }
        })

        // 10. Emit Workflow Events
        const payload = {
            organizationId,
            jobId,
            candidateId,
            entityType: 'SCREENING_RESULT',
            entityId: screeningResult._id,
            finalScore,
            status
        }

        fluxEvents.emitDomainEvent(DomainEvent.SCREENING_COMPLETED, payload)

        // Evaluate threshold triggers
        if (jobProfile.thresholds) {
            if (finalScore >= jobProfile.thresholds.shortlist) {
                fluxEvents.emitDomainEvent(DomainEvent.SCREENING_SCORE_ABOVE, payload)
            } else if (finalScore <= jobProfile.thresholds.autoReject) {
                // Ensure safe strict > 0 to prevent accidental 0 score wiping if unset
                if (jobProfile.thresholds.autoReject > 0 || jobProfile.thresholds.autoReject === finalScore) {
                    fluxEvents.emitDomainEvent(DomainEvent.SCREENING_SCORE_BELOW, payload)
                }
            }
        }

        console.log(`[ATS Screening] Completed successfully for candidate ${candidateId}. Final Score: ${finalScore}`)

    } catch (error) {
        console.error(`[ATS Screening] Worker error for job ${job.id}:`, error)

        // Log failure capture (dead-lettering is partially handled by BullMQ 'failed' state)
        if (job.attemptsMade >= (job.opts.attempts || 3) - 1) {
            await AuditLog.create({
                organizationId,
                entityType: 'SCREENING_RESULT',
                entityId: candidateId as any,
                action: 'SCREENING_FAILED',
                newValue: {
                    error: error instanceof Error ? error.message : String(error),
                    jobId
                }
            }).catch(console.error)

            // Upsert a failure record
            await ScreeningResult.findOneAndUpdate(
                { candidateId, jobId, organizationId },
                {
                    status: 'ERROR',
                    scoringVersion: SCORING_VERSION
                },
                { upsert: true }
            ).catch(console.error)
        }

        throw error // bubble up for retry
    }
}
