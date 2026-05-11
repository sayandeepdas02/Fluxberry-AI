/**
 * AI Pipeline Analysis Service
 * 100% deterministic — uses aggregation pipelines, no LLM.
 * Detects bottlenecks, suggests optimizations, forecasts timelines.
 */

import { JobApplication, ApplicationStatus, Job as JobModel, StageHistory } from '../../../database/models/index.js'
import mongoose from 'mongoose'

interface BottleneckResult {
    stage: string
    avgTimeInStageHours: number
    candidateCount: number
    severity: 'low' | 'medium' | 'high' | 'critical'
}

interface OptimizationSuggestion {
    area: string
    suggestion: string
    impact: 'low' | 'medium' | 'high'
    dataPoint: string
}

class AIPipelineService {

    /**
     * Detect pipeline bottlenecks by analyzing time-in-stage for each status.
     */
    async detectBottlenecks(orgId: string, jobId?: string): Promise<BottleneckResult[]> {
        const matchStage: any = { organizationId: new mongoose.Types.ObjectId(orgId) }
        if (jobId) matchStage.jobId = new mongoose.Types.ObjectId(jobId)

        // Aggregate average time in each stage from StageHistory
        const stageAnalysis = await StageHistory.aggregate([
            { $match: { organizationId: new mongoose.Types.ObjectId(orgId) } },
            { $match: { timeInStageMs: { $gt: 0 } } },
            {
                $group: {
                    _id: '$fromStage',
                    avgTimeMs: { $avg: '$timeInStageMs' },
                    maxTimeMs: { $max: '$timeInStageMs' },
                    count: { $sum: 1 },
                },
            },
            { $sort: { avgTimeMs: -1 } },
        ])

        return stageAnalysis
            .filter(s => s._id != null)
            .map(s => {
                const avgHours = Math.round(s.avgTimeMs / (1000 * 60 * 60) * 10) / 10
                let severity: BottleneckResult['severity'] = 'low'
                if (avgHours > 168) severity = 'critical' // > 7 days
                else if (avgHours > 72) severity = 'high' // > 3 days
                else if (avgHours > 24) severity = 'medium' // > 1 day

                return {
                    stage: s._id,
                    avgTimeInStageHours: avgHours,
                    candidateCount: s.count,
                    severity,
                }
            })
    }

    /**
     * Generate data-driven optimization suggestions.
     */
    async suggestOptimizations(orgId: string): Promise<OptimizationSuggestion[]> {
        const suggestions: OptimizationSuggestion[] = []
        const orgObjectId = new mongoose.Types.ObjectId(orgId)

        // 1. Check for stale applications (no activity in 14 days)
        const fourteenDaysAgo = new Date()
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

        const staleCount = await JobApplication.countDocuments({
            organizationId: orgObjectId,
            status: { $nin: [ApplicationStatus.HIRED, ApplicationStatus.REJECTED] },
            lastActivityAt: { $lt: fourteenDaysAgo },
            isDeleted: false,
        })

        if (staleCount > 0) {
            suggestions.push({
                area: 'Stale Applications',
                suggestion: `${staleCount} applications have had no activity in 14+ days. Review or archive them to keep the pipeline clean.`,
                impact: staleCount > 20 ? 'high' : 'medium',
                dataPoint: `${staleCount} stale applications`,
            })
        }

        // 2. Check screening-to-interview conversion
        const [screeningCount, interviewCount] = await Promise.all([
            JobApplication.countDocuments({ organizationId: orgObjectId, status: ApplicationStatus.SCREENING }),
            JobApplication.countDocuments({ organizationId: orgObjectId, status: ApplicationStatus.INTERVIEW }),
        ])

        if (screeningCount > 0 && interviewCount === 0) {
            suggestions.push({
                area: 'Screening Backlog',
                suggestion: `${screeningCount} candidates in screening but none have moved to interview. Consider batch-reviewing screening results.`,
                impact: 'high',
                dataPoint: `${screeningCount} in screening, 0 in interview`,
            })
        }

        // 3. Check for jobs with no recent applications
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const activeJobs = await JobModel.find({
            organizationId: orgObjectId,
            status: 'PUBLISHED',
            deletedAt: null,
        }).select('_id title').lean()

        for (const job of activeJobs.slice(0, 10)) {
            const recentApps = await JobApplication.countDocuments({
                jobId: (job as any)._id,
                submittedAt: { $gte: thirtyDaysAgo },
            })
            if (recentApps === 0) {
                suggestions.push({
                    area: 'Low Application Volume',
                    suggestion: `"${(job as any).title}" has received no applications in 30 days. Consider improving the job posting or sourcing candidates.`,
                    impact: 'medium',
                    dataPoint: '0 applications in 30 days',
                })
            }
        }

        // 4. Check offer acceptance rate
        const [offersSent, offersAccepted] = await Promise.all([
            JobApplication.countDocuments({ organizationId: orgObjectId, status: ApplicationStatus.OFFER_SENT }),
            JobApplication.countDocuments({ organizationId: orgObjectId, status: ApplicationStatus.OFFER_ACCEPTED }),
        ])

        const totalOffers = offersSent + offersAccepted
        if (totalOffers > 5) {
            const acceptRate = Math.round((offersAccepted / totalOffers) * 100)
            if (acceptRate < 50) {
                suggestions.push({
                    area: 'Offer Acceptance',
                    suggestion: `Offer acceptance rate is ${acceptRate}%. Consider reviewing compensation packages or candidate experience during offer stage.`,
                    impact: 'high',
                    dataPoint: `${acceptRate}% acceptance rate`,
                })
            }
        }

        return suggestions
    }

    /**
     * Forecast hiring timeline for a specific job based on historical velocity.
     */
    async forecastHiringTimeline(jobId: string, orgId: string) {
        const matchStage = {
            organizationId: new mongoose.Types.ObjectId(orgId),
            jobId: new mongoose.Types.ObjectId(jobId),
        }

        const [total, hired, avgTimeResult] = await Promise.all([
            JobApplication.countDocuments(matchStage),
            JobApplication.countDocuments({ ...matchStage, status: ApplicationStatus.HIRED }),
            JobApplication.aggregate([
                { $match: { ...matchStage, status: ApplicationStatus.HIRED } },
                {
                    $project: {
                        durationDays: {
                            $divide: [
                                { $subtract: [{ $ifNull: ['$updatedAt', new Date()] }, '$createdAt'] },
                                1000 * 60 * 60 * 24,
                            ],
                        },
                    },
                },
                { $group: { _id: null, avg: { $avg: '$durationDays' }, min: { $min: '$durationDays' }, max: { $max: '$durationDays' } } },
            ]),
        ])

        const avgDays = avgTimeResult[0]?.avg ?? 0
        const inPipeline = total - hired

        return {
            totalApplications: total,
            hired,
            inPipeline,
            averageDaysToHire: Math.round(avgDays),
            minDaysToHire: Math.round(avgTimeResult[0]?.min ?? 0),
            maxDaysToHire: Math.round(avgTimeResult[0]?.max ?? 0),
            estimatedNextHireDate: avgDays > 0
                ? new Date(Date.now() + avgDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                : null,
            confidence: hired >= 5 ? 'high' : hired >= 2 ? 'medium' : 'low',
        }
    }
}

export const aiPipelineService = new AIPipelineService()
