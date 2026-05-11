import { Job, Candidate, AssessmentAttempt, AnalyticsSnapshot, JobApplication, StageHistory, ApplicationStatus, OrganizationMember, User } from '../../database/models/index.js'
import { ScreeningResult } from '../ats-screening/models/screening-result.model.js'
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

        // Current period counts
        const [
            activeJobs,
            totalJobs,
            totalCandidates,
            totalApplications,
            awaitingReview,
        ] = await Promise.all([
            Job.countDocuments({ ...orgFilter, status: 'PUBLISHED' }),
            Job.countDocuments(orgFilter),
            jobId
                ? JobApplication.distinct('candidateId', combinedFilter).then(ids => ids.length)
                : Candidate.countDocuments(orgFilter),
            JobApplication.countDocuments(combinedFilter),
            JobApplication.countDocuments({ ...combinedFilter, status: ApplicationStatus.APPLIED }),
        ])

        // Previous 30-day counts for trend calculation
        const now = new Date()
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

        const [
            candidatesLast30,
            candidatesPrev30,
            appsLast30,
            appsPrev30,
        ] = await Promise.all([
            Candidate.countDocuments({ ...orgFilter, createdAt: { $gte: thirtyDaysAgo } }),
            Candidate.countDocuments({ ...orgFilter, createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } }),
            JobApplication.countDocuments({ ...combinedFilter, submittedAt: { $gte: thirtyDaysAgo } }),
            JobApplication.countDocuments({ ...combinedFilter, submittedAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } }),
        ])

        // Calculate trend percentage and direction
        function calcTrend(current: number, previous: number): { trend: number; trendDirection: 'up' | 'down' | 'neutral' } {
            if (previous === 0 && current === 0) return { trend: 0, trendDirection: 'neutral' as const }
            if (previous === 0) return { trend: 100, trendDirection: 'up' as const }
            const pct = Math.round(((current - previous) / previous) * 100)
            return {
                trend: Math.abs(pct),
                trendDirection: pct > 0 ? 'up' as const : pct < 0 ? 'down' as const : 'neutral' as const
            }
        }

        const candidateTrend = calcTrend(candidatesLast30, candidatesPrev30)
        const appTrend = calcTrend(appsLast30, appsPrev30)

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
                ...candidateTrend
            },
            applications: {
                label: 'Total Applications',
                value: totalApplications,
                ...appTrend
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

    async getAtsEfficiencyMetrics(organizationId: string, jobId?: string) {
        const cacheKey = this.getCacheKey(organizationId, 'atsEfficiency', jobId)
        const cached = await this.getCached(cacheKey)
        if (cached) return cached

        const matchStage = {
            organizationId: new mongoose.Types.ObjectId(organizationId),
            ...(jobId ? { jobId: new mongoose.Types.ObjectId(jobId) } : {})
        }

        // 1. Get total screened candidates to calculate "Hours Saved"
        // Base estimate: 3 minutes per manual resume screen
        const totalScreened = await ScreeningResult.countDocuments(matchStage)
        const hoursSaved = Math.round((totalScreened * 3) / 60)

        // 2. Score Distribution (Histogram)
        const distributionAgg = await ScreeningResult.aggregate([
            { $match: matchStage },
            {
                $bucket: {
                    groupBy: "$finalScore",
                    boundaries: [0, 20, 40, 60, 80, 101], // 101 to include 100
                    default: "Unknown",
                    output: { count: { $sum: 1 } }
                }
            }
        ])

        const formatRange = (min: number, max: number) => `${min}-${max}`
        const chartData = [
            { range: formatRange(0, 19), count: 0 },
            { range: formatRange(20, 39), count: 0 },
            { range: formatRange(40, 59), count: 0 },
            { range: formatRange(60, 79), count: 0 },
            { range: formatRange(80, 100), count: 0 },
        ]

        distributionAgg.forEach(bucket => {
            if (bucket._id === 0) chartData[0].count = bucket.count
            if (bucket._id === 20) chartData[1].count = bucket.count
            if (bucket._id === 40) chartData[2].count = bucket.count
            if (bucket._id === 60) chartData[3].count = bucket.count
            if (bucket._id === 80) chartData[4].count = bucket.count
        })

        const result = {
            hoursSaved,
            totalScreened,
            scoreDistribution: chartData
        }

        await this.setCache(cacheKey, result)
        return result
    }
}

    // ── Phase 3: Advanced Analytics ──────────────────────────────

    async getHiringVelocityTrend(organizationId: string, months = 6): Promise<{ month: string; avgDays: number; hires: number }[]> {
        const cacheKey = this.getCacheKey(organizationId, `velocity:${months}`)
        const cached = await this.getCached(cacheKey)
        if (cached) return cached as any

        const cutoff = new Date()
        cutoff.setMonth(cutoff.getMonth() - months)

        const pipeline = await JobApplication.aggregate([
            {
                $match: {
                    organizationId: new mongoose.Types.ObjectId(organizationId),
                    status: ApplicationStatus.HIRED,
                    updatedAt: { $gte: cutoff },
                }
            },
            {
                $addFields: {
                    daysToHire: {
                        $divide: [
                            { $subtract: ['$updatedAt', '$submittedAt'] },
                            1000 * 60 * 60 * 24,
                        ]
                    },
                    month: { $dateToString: { format: '%Y-%m', date: '$updatedAt' } }
                }
            },
            {
                $group: {
                    _id: '$month',
                    avgDays: { $avg: '$daysToHire' },
                    hires: { $sum: 1 },
                }
            },
            { $sort: { _id: 1 } },
        ])

        const result = pipeline.map((p: any) => ({
            month: p._id,
            avgDays: Math.round(p.avgDays || 0),
            hires: p.hires,
        }))

        await this.setCache(cacheKey, result)
        return result
    }

    async getSourceQualityScoring(organizationId: string): Promise<{
        source: string
        total: number
        hired: number
        interviewed: number
        conversionRate: number
        hireRate: number
    }[]> {
        const cacheKey = this.getCacheKey(organizationId, 'sourceQuality')
        const cached = await this.getCached(cacheKey)
        if (cached) return cached as any

        const pipeline = await JobApplication.aggregate([
            { $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } },
            {
                $lookup: {
                    from: 'candidates',
                    localField: 'candidateId',
                    foreignField: '_id',
                    as: 'candidate',
                }
            },
            { $unwind: '$candidate' },
            {
                $group: {
                    _id: { $ifNull: ['$candidate.source', 'Direct'] },
                    total: { $sum: 1 },
                    hired: {
                        $sum: { $cond: [{ $eq: ['$status', ApplicationStatus.HIRED] }, 1, 0] }
                    },
                    interviewed: {
                        $sum: { $cond: [{ $in: ['$status', [ApplicationStatus.INTERVIEW, ApplicationStatus.OFFER_SENT, ApplicationStatus.HIRED]] }, 1, 0] }
                    },
                }
            },
            { $sort: { total: -1 } },
        ])

        const result = pipeline.map((p: any) => ({
            source: p._id,
            total: p.total,
            hired: p.hired,
            interviewed: p.interviewed,
            conversionRate: p.total > 0 ? Math.round((p.interviewed / p.total) * 100) : 0,
            hireRate: p.total > 0 ? Math.round((p.hired / p.total) * 100) : 0,
        }))

        await this.setCache(cacheKey, result)
        return result
    }

    async getStageDropoffAnalysis(organizationId: string, jobId?: string): Promise<{
        stage: string
        entered: number
        exited: number
        dropoffRate: number
        avgDaysInStage: number
    }[]> {
        const cacheKey = this.getCacheKey(organizationId, 'stageDropoff', jobId)
        const cached = await this.getCached(cacheKey)
        if (cached) return cached as any

        const matchStage: Record<string, unknown> = { organizationId: new mongoose.Types.ObjectId(organizationId) }
        if (jobId) matchStage.jobId = new mongoose.Types.ObjectId(jobId)

        const pipeline = await StageHistory.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: '$toStage',
                    entered: { $sum: 1 },
                    avgTimeMs: { $avg: '$timeInStageMs' },
                }
            },
            { $sort: { _id: 1 } },
        ])

        const stageOrder = [
            ApplicationStatus.APPLIED,
            ApplicationStatus.SCREENING,
            ApplicationStatus.INTERVIEW,
            ApplicationStatus.OFFER_SENT,
            ApplicationStatus.HIRED,
        ]

        const stageCounts: Record<string, number> = {}
        pipeline.forEach((p: any) => { stageCounts[p._id] = p.entered })

        const result = stageOrder.map((stage, i) => {
            const entered = stageCounts[stage] || 0
            const nextStage = stageOrder[i + 1]
            const exited = nextStage ? (stageCounts[nextStage] || 0) : entered
            const avgMs = pipeline.find((p: any) => p._id === stage)?.avgTimeMs || 0

            return {
                stage,
                entered,
                exited: Math.min(exited, entered),
                dropoffRate: entered > 0 ? Math.round(((entered - Math.min(exited, entered)) / entered) * 100) : 0,
                avgDaysInStage: Math.round(avgMs / (1000 * 60 * 60 * 24)) || 0,
            }
        }).filter(s => s.entered > 0)

        await this.setCache(cacheKey, result)
        return result
    }

    async getRecruiterPerformance(organizationId: string): Promise<{
        userId: string
        name: string
        email: string
        applicationsReviewed: number
        hired: number
        avgTimeToReview: number
        hireRate: number
    }[]> {
        const cacheKey = this.getCacheKey(organizationId, 'recruiterPerformance')
        const cached = await this.getCached(cacheKey)
        if (cached) return cached as any

        // Get all members of the org
        const members = await OrganizationMember.find({ organizationId: new mongoose.Types.ObjectId(organizationId) })
            .populate('userId', 'firstName lastName email')
            .lean()

        // For each member, count applications they're assigned to or stage-changed
        const memberIds = members.map((m: any) => m.userId?._id || m.userId)

        const [assignedStats] = await Promise.all([
            JobApplication.aggregate([
                {
                    $match: {
                        organizationId: new mongoose.Types.ObjectId(organizationId),
                        assignedTo: { $in: memberIds },
                    }
                },
                {
                    $group: {
                        _id: '$assignedTo',
                        applicationsReviewed: { $sum: 1 },
                        hired: {
                            $sum: { $cond: [{ $eq: ['$status', ApplicationStatus.HIRED] }, 1, 0] }
                        },
                    }
                }
            ])
        ])

        const statsByUser: Record<string, { applicationsReviewed: number; hired: number }> = {}
        assignedStats.forEach((s: any) => {
            statsByUser[s._id.toString()] = { applicationsReviewed: s.applicationsReviewed, hired: s.hired }
        })

        const result = members.map((m: any) => {
            const user = m.userId as any
            const uid = (user?._id || user)?.toString()
            const stats = statsByUser[uid] || { applicationsReviewed: 0, hired: 0 }
            return {
                userId: uid,
                name: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Unknown',
                email: user?.email || '',
                applicationsReviewed: stats.applicationsReviewed,
                hired: stats.hired,
                avgTimeToReview: 0,
                hireRate: stats.applicationsReviewed > 0 ? Math.round((stats.hired / stats.applicationsReviewed) * 100) : 0,
            }
        }).filter(r => r.applicationsReviewed > 0)
            .sort((a, b) => b.hired - a.hired)

        await this.setCache(cacheKey, result)
        return result
    }
}

export const analyticsService = new AnalyticsService()
