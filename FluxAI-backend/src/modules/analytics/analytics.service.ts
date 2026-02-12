import { Job, Candidate, AssessmentAttempt, AnalyticsSnapshot, JobApplication, StageHistory, ApplicationStatus } from '../../database/models/index.js'
import { KPIData, AnalyticsTrendData, DemographicsData } from './analytics.types.js'
import { redisConnection } from '../../jobs/redis.js'
import mongoose from 'mongoose'

const CACHE_TTL = 600 // 10 minutes

class AnalyticsService {
    private getCacheKey(orgId: string, metric: string, jobId?: string): string {
        return `analytics:${orgId}:${metric}:${jobId || 'all'}`
    }

    private async getCached<T>(key: string): Promise<T | null> {
        try {
            const data = await redisConnection.get(key)
            return data ? JSON.parse(data) : null
        } catch (error) {
            console.error('Redis get error:', error)
            return null
        }
    }

    private async setCache(key: string, data: any): Promise<void> {
        try {
            await redisConnection.setex(key, CACHE_TTL, JSON.stringify(data))
        } catch (error) {
            console.error('Redis set error:', error)
        }
    }

    async getKPIs(organizationId: string, jobId?: string): Promise<Record<string, KPIData>> {
        const cacheKey = this.getCacheKey(organizationId, 'kpis', jobId)
        const cached = await this.getCached<Record<string, KPIData>>(cacheKey)
        if (cached) return cached

        const jobFilter = jobId ? { jobId: new mongoose.Types.ObjectId(jobId) } : {}
        const orgFilter = { organizationId: new mongoose.Types.ObjectId(organizationId) }
        const combinedFilter = { ...orgFilter, ...jobFilter }

        const [
            activeJobs,
            totalJobs,
            totalCandidates,
            totalApplications,
            awaitingReview,
        ] = await Promise.all([
            Job.countDocuments({ ...orgFilter, status: 'PUBLISHED' }),
            Job.countDocuments(orgFilter),
            // Candidates are org-wide, but if filtering by job, we count applications unique candidates
            jobId
                ? JobApplication.distinct('candidateId', combinedFilter).then(ids => ids.length)
                : Candidate.countDocuments(orgFilter),
            JobApplication.countDocuments(combinedFilter),
            JobApplication.countDocuments({ ...combinedFilter, status: ApplicationStatus.APPLIED }),
        ])

        const result = {
            activeJobs: {
                label: 'Active Jobs',
                value: activeJobs,
                trend: 0,
                trendDirection: 'neutral' as const
            },
            totalCandidates: {
                label: 'Total Candidates',
                value: totalCandidates,
                trend: 0,
                trendDirection: 'neutral' as const
            },
            applications: {
                label: 'Total Applications',
                value: totalApplications,
                trend: 0,
                trendDirection: 'neutral' as const
            },
            awaitingReview: {
                label: 'Awaiting Review',
                value: awaitingReview,
                trend: 0,
                trendDirection: 'neutral' as const
            }
        }

        await this.setCache(cacheKey, result)
        return result
    }

    async getFunnelMetrics(organizationId: string, jobId?: string) {
        const cacheKey = this.getCacheKey(organizationId, 'funnel', jobId)
        const cached = await this.getCached(cacheKey)
        if (cached) return cached

        const matchStage = {
            organizationId: new mongoose.Types.ObjectId(organizationId),
            ...(jobId ? { jobId: new mongoose.Types.ObjectId(jobId) } : {})
        }

        const stageAgg = await JobApplication.aggregate([
            { $match: matchStage },
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ])

        const stageDistribution: Record<string, number> = {}
        Object.values(ApplicationStatus).forEach(s => stageDistribution[s] = 0)
        stageAgg.forEach(item => stageDistribution[item._id] = item.count)

        // Conversion Logic
        const applied = stageDistribution[ApplicationStatus.APPLIED] || 0
        const screening = stageDistribution[ApplicationStatus.SCREENING] || 0
        const interview = stageDistribution[ApplicationStatus.INTERVIEW] || 0
        const offer = stageDistribution[ApplicationStatus.OFFER_SENT] || 0
        const hired = stageDistribution[ApplicationStatus.HIRED] || 0
        const total = Object.values(stageDistribution).reduce((a, b) => a + b, 0)

        const conversionRates = {
            appliedToInterview: total > 0 ? Math.round(((interview + offer + hired) / total) * 100) : 0,
            interviewToOffer: (interview + offer + hired) > 0 ? Math.round(((offer + hired) / (interview + offer + hired)) * 100) : 0,
            offerToHired: (offer + hired) > 0 ? Math.round((hired / (offer + hired)) * 100) : 0,
        }

        const result = { stageDistribution, conversionRates }
        await this.setCache(cacheKey, result)
        return result
    }

    async getTimeToHire(organizationId: string, jobId?: string) {
        const cacheKey = this.getCacheKey(organizationId, 'timeToHire', jobId)
        const cached = await this.getCached(cacheKey)
        if (cached) return cached

        const matchStage = {
            organizationId: new mongoose.Types.ObjectId(organizationId),
            ...(jobId ? { jobId: new mongoose.Types.ObjectId(jobId) } : {})
        }

        // Get all hired applications to math with stage history
        // Or simpler: aggregation on StageHistory
        // But StageHistory doesn't have jobId directly, need lookup

        const avgTimeAgg = await JobApplication.aggregate([
            { $match: { ...matchStage, status: ApplicationStatus.HIRED } },
            {
                $lookup: {
                    from: 'stagehistories',
                    localField: '_id',
                    foreignField: 'applicationId',
                    as: 'history'
                }
            },
            {
                $utilities: {
                    $addFields: {
                        firstApplied: {
                            $min: {
                                $filter: {
                                    input: '$history',
                                    as: 'h',
                                    cond: { $eq: ['$$h.toStage', ApplicationStatus.APPLIED] }
                                }
                            }
                        },
                        hiredAt: {
                            $min: {
                                $filter: {
                                    input: '$history',
                                    as: 'h',
                                    cond: { $eq: ['$$h.toStage', ApplicationStatus.HIRED] }
                                }
                            }
                        }
                    }
                }
            },
            // Fallback: Use createdAt and updatedAt if history incomplete
            {
                $project: {
                    duration: {
                        $divide: [
                            { $subtract: [{ $ifNull: ['$updatedAt', new Date()] }, '$createdAt'] },
                            1000 * 60 * 60 * 24 // days
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    avgDays: { $avg: '$duration' },
                    min: { $min: '$duration' },
                    max: { $max: '$duration' }
                }
            }
        ])

        const result = avgTimeAgg[0] || { avgDays: 0, min: 0, max: 0 }
        await this.setCache(cacheKey, result)
        return result
    }

    async getApplicationVolume(organizationId: string, timeframe: 'week' | 'month' = 'month', jobId?: string): Promise<AnalyticsTrendData[]> {
        const cacheKey = this.getCacheKey(organizationId, `volume:${timeframe}`, jobId)
        const cached = await this.getCached<AnalyticsTrendData[]>(cacheKey)
        if (cached) return cached

        const daysBack = timeframe === 'week' ? 7 : 30
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - daysBack)

        const matchStage = {
            organizationId: new mongoose.Types.ObjectId(organizationId),
            submittedAt: { $gte: startDate },
            ...(jobId ? { jobId: new mongoose.Types.ObjectId(jobId) } : {})
        }

        const pipeline = await JobApplication.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$submittedAt' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ])

        const result: AnalyticsTrendData[] = []
        for (let i = 0; i < daysBack; i++) {
            const d = new Date()
            d.setDate(d.getDate() - (daysBack - 1 - i))
            const dateStr = d.toISOString().split('T')[0]
            const found = pipeline.find((p: any) => p._id === dateStr)
            result.push({ date: dateStr, value: found ? found.count : 0 })
        }

        await this.setCache(cacheKey, result)
        return result
    }

    async getSourcePerformance(organizationId: string, jobId?: string): Promise<DemographicsData[]> {
        const cacheKey = this.getCacheKey(organizationId, 'source', jobId)
        const cached = await this.getCached<DemographicsData[]>(cacheKey)
        if (cached) return cached

        const matchStage = {
            organizationId: new mongoose.Types.ObjectId(organizationId),
            ...(jobId ? { jobId: new mongoose.Types.ObjectId(jobId) } : {})
        }

        const sourceAgg = await JobApplication.aggregate([
            { $match: matchStage },
            {
                $lookup: {
                    from: 'candidates',
                    localField: 'candidateId',
                    foreignField: '_id',
                    as: 'candidate'
                }
            },
            { $unwind: '$candidate' },
            {
                $group: {
                    _id: { $ifNull: ['$candidate.source', 'Direct'] },
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ])

        const total = sourceAgg.reduce((sum, item) => sum + item.count, 0) || 1

        const result = sourceAgg.map(item => ({
            label: item._id,
            value: item.count,
            percentage: Math.round((item.count / total) * 100)
        }))

        await this.setCache(cacheKey, result)
        return result
    }
}

export const analyticsService = new AnalyticsService()
