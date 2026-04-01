/**
 * ATS Stats Service
 *
 * Computes job screening statistics using MongoDB aggregation pipelines.
 * No full document fetches — O(n) JS loops replaced with DB-side aggregation.
 */

import { JobApplication } from '../../database/models/index.js'
import { Job as JobModel } from '../../database/models/index.js'
import { ScreeningResult, ScreeningStatus } from './models/screening-result.model.js'
import { DEFAULT_SCORING_CONFIG, type IScoringConfig } from './scoring-config.types.js'

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

/** Resolve thresholds from Job.scoringConfig or fall back to defaults. */
async function resolveThresholds(jobId: string, orgId: string): Promise<IScoringConfig['thresholds']> {
    const job = await JobModel.findOne({ _id: jobId, organizationId: orgId }).select('scoringConfig').lean()
    return (job as any)?.scoringConfig?.thresholds ?? DEFAULT_SCORING_CONFIG.thresholds
}

// ──────────────────────────────────────────────────────────────
// Stats Service
// ──────────────────────────────────────────────────────────────

export class StatsService {
    async getJobScreeningStats(jobId: string, orgId: string) {
        // Resolve thresholds from Job.scoringConfig (no hardcoded 80/60)
        const thresholds = await resolveThresholds(jobId, orgId)
        const shortlistThreshold = thresholds.shortlist
        const reviewThreshold    = thresholds.review

        // Total applicants (from JobApplication)
        const totalApplicants = await JobApplication.countDocuments({ jobId, organizationId: orgId })

        // ── Aggregation pipeline: compute all stats in one DB query ──────
        const [aggResult] = await ScreeningResult.aggregate([
            { $match: { jobId: new (await import('mongoose')).Types.ObjectId(jobId), organizationId: new (await import('mongoose')).Types.ObjectId(orgId) } },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    // Count by status category
                    scoredCount: {
                        $sum: { $cond: [{ $in: ['$status', [ScreeningStatus.PASSED, 'SCORED']] }, 1, 0] }
                    },
                    failedGateCount: {
                        $sum: { $cond: [{ $eq: ['$status', ScreeningStatus.FAILED_GATE] }, 1, 0] }
                    },
                    parseFailedCount: {
                        $sum: { $cond: [{ $in: ['$status', [ScreeningStatus.PARSE_FAILED, ScreeningStatus.ERROR]] }, 1, 0] }
                    },
                    inProgressCount: {
                        $sum: {
                            $cond: [{
                                $in: ['$status', [
                                    ScreeningStatus.AWAITING_PARSE,
                                    ScreeningStatus.SCORING_IN_PROGRESS,
                                    ScreeningStatus.PENDING,
                                ]]
                            }, 1, 0]
                        }
                    },
                    // Shortlisted: scored AND score >= shortlistThreshold
                    autoShortlisted: {
                        $sum: {
                            $cond: [{
                                $and: [
                                    { $in: ['$status', [ScreeningStatus.PASSED, 'SCORED']] },
                                    { $gte: ['$finalScore', shortlistThreshold] },
                                ]
                            }, 1, 0]
                        }
                    },
                    // Review: scored AND score in [reviewThreshold, shortlistThreshold)
                    needsReview: {
                        $sum: {
                            $cond: [{
                                $and: [
                                    { $in: ['$status', [ScreeningStatus.PASSED, 'SCORED']] },
                                    { $gte: ['$finalScore', reviewThreshold] },
                                    { $lt:  ['$finalScore', shortlistThreshold] },
                                ]
                            }, 1, 0]
                        }
                    },
                    // Sum of all scored final scores (for avg)
                    scoreSum: {
                        $sum: {
                            $cond: [{ $in: ['$status', [ScreeningStatus.PASSED, 'SCORED']] }, '$finalScore', 0]
                        }
                    },
                    // All scored values for percentile calculation
                    allScores: {
                        $push: {
                            $cond: [{ $in: ['$status', [ScreeningStatus.PASSED, 'SCORED']] }, '$finalScore', '$$REMOVE']
                        }
                    },
                }
            }
        ])

        // ── Histogram via bucket aggregation ─────────────────────────────
        const histogramResult = await ScreeningResult.aggregate([
            {
                $match: {
                    jobId:          new (await import('mongoose')).Types.ObjectId(jobId),
                    organizationId: new (await import('mongoose')).Types.ObjectId(orgId),
                    status:         { $in: [ScreeningStatus.PASSED, 'SCORED'] },
                }
            },
            {
                $bucket: {
                    groupBy: '$finalScore',
                    boundaries: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 101],
                    default: 'other',
                    output: { count: { $sum: 1 } }
                }
            }
        ])

        // Map bucket result to { range, count } format
        const bucketLabels = ['0-9', '10-19', '20-29', '30-39', '40-49', '50-59', '60-69', '70-79', '80-89', '90-100']
        const bucketMap = new Map(histogramResult.map((b: any) => [b._id, b.count]))
        const boundaries = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90]
        const histogram = bucketLabels.map((range, i) => ({
            range,
            count: bucketMap.get(boundaries[i]) ?? 0,
        }))

        // ── Build response from aggregation ───────────────────────────────
        if (!aggResult) {
            return {
                overview: {
                    totalApplicants,
                    autoShortlisted: 0,
                    needsReview: 0,
                    rejected: 0,
                    screeningInProgress: 0,
                    parseFailed: 0,
                },
                histogram,
                percentiles: { p50: 0, p75: 0, p90: 0 },
                avgScore: 0,
            }
        }

        const {
            scoredCount, failedGateCount, parseFailedCount, inProgressCount,
            autoShortlisted, needsReview, scoreSum, allScores,
        } = aggResult

        const rejected = (scoredCount - autoShortlisted - needsReview) + failedGateCount

        // Compute percentiles from sorted score array
        const sortedScores = ((allScores as number[]) || []).sort((a, b) => a - b)
        const computePercentile = (p: number) => {
            if (sortedScores.length === 0) return 0
            const index = Math.ceil((p / 100) * sortedScores.length) - 1
            return sortedScores[Math.max(0, index)]
        }

        const screeningInProgress = Math.max(0, totalApplicants - (aggResult.total ?? 0) + inProgressCount)

        return {
            overview: {
                totalApplicants,
                autoShortlisted,
                needsReview,
                rejected,
                screeningInProgress,
                parseFailed: parseFailedCount,
            },
            histogram,
            percentiles: {
                p50: computePercentile(50),
                p75: computePercentile(75),
                p90: computePercentile(90),
            },
            avgScore: sortedScores.length > 0
                ? Math.round(scoreSum / sortedScores.length)
                : 0,
        }
    }
}

export const statsService = new StatsService()
