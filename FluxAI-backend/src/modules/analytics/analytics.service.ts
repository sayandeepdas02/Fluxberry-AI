import { Job, Candidate, AssessmentAttempt, AnalyticsSnapshot, JobApplication, StageHistory, ApplicationStatus } from '../../database/models/index.js'
import { KPIData, AnalyticsTrendData, DemographicsData } from './analytics.types.js'

class AnalyticsService {
    async getKPIs(organizationId: string): Promise<Record<string, KPIData>> {
        const [
            activeJobs,
            totalJobs,
            totalCandidates,
            totalApplications,
            awaitingReview,
        ] = await Promise.all([
            Job.countDocuments({ organizationId, status: 'PUBLISHED' }),
            Job.countDocuments({ organizationId }),
            Candidate.countDocuments({ organizationId }),
            JobApplication.countDocuments({ organizationId }),
            JobApplication.countDocuments({ organizationId, status: ApplicationStatus.APPLIED }),
        ])

        return {
            activeJobs: {
                label: 'Active Jobs',
                value: activeJobs,
                trend: 0,
                trendDirection: 'neutral'
            },
            totalCandidates: {
                label: 'Total Candidates',
                value: totalCandidates,
                trend: 0,
                trendDirection: 'neutral'
            },
            applications: {
                label: 'Total Applications',
                value: totalApplications,
                trend: 0,
                trendDirection: 'neutral'
            },
            awaitingReview: {
                label: 'Awaiting Review',
                value: awaitingReview,
                trend: 0,
                trendDirection: 'neutral'
            }
        }
    }

    /**
     * ATS-specific analytics: conversion rates, stage distribution, avg time in stage
     */
    async getATSAnalytics(organizationId: string) {
        const [
            totalJobs,
            activeJobs,
            totalCandidates,
            totalApplications,
        ] = await Promise.all([
            Job.countDocuments({ organizationId }),
            Job.countDocuments({ organizationId, status: 'PUBLISHED' }),
            Candidate.countDocuments({ organizationId }),
            JobApplication.countDocuments({ organizationId }),
        ])

        // Stage distribution across all org applications
        const stageAgg = await JobApplication.aggregate([
            { $match: { organizationId: { $exists: true } } },
            {
                $addFields: {
                    orgIdStr: { $toString: '$organizationId' }
                }
            },
            { $match: { orgIdStr: organizationId } },
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ])

        const stageDistribution: Record<string, number> = {}
        for (const stage of Object.values(ApplicationStatus)) {
            stageDistribution[stage] = 0
        }
        for (const item of stageAgg) {
            stageDistribution[item._id] = item.count
        }

        // Conversion rates
        const applied = stageDistribution[ApplicationStatus.APPLIED] || 0
        const screening = stageDistribution[ApplicationStatus.SCREENING] || 0
        const interview = stageDistribution[ApplicationStatus.INTERVIEW] || 0
        const offer = stageDistribution[ApplicationStatus.OFFER_SENT] || 0
        const hired = stageDistribution[ApplicationStatus.HIRED] || 0

        const conversionRates = {
            appliedToInterview: totalApplications > 0
                ? Math.round(((interview + offer + hired) / totalApplications) * 100)
                : 0,
            interviewToOffer: (interview + offer + hired) > 0
                ? Math.round(((offer + hired) / (interview + offer + hired)) * 100)
                : 0,
            offerToHired: (offer + hired) > 0
                ? Math.round((hired / (offer + hired)) * 100)
                : 0,
        }

        // Avg time in stage (from stage history)
        const avgTimeAgg = await StageHistory.aggregate([
            {
                $addFields: {
                    orgIdStr: { $toString: '$organizationId' }
                }
            },
            { $match: { orgIdStr: organizationId } },
            { $sort: { applicationId: 1, changedAt: 1 } },
            {
                $group: {
                    _id: '$fromStage',
                    avgDays: {
                        $avg: {
                            $divide: [
                                { $subtract: ['$changedAt', { $ifNull: ['$createdAt', '$changedAt'] }] },
                                1000 * 60 * 60 * 24
                            ]
                        }
                    }
                }
            }
        ])

        const avgTimeInStage: Record<string, number> = {}
        for (const item of avgTimeAgg) {
            if (item._id) {
                avgTimeInStage[item._id] = Math.round(item.avgDays * 10) / 10
            }
        }

        return {
            totalJobs,
            activeJobs,
            totalCandidates,
            totalApplications,
            conversionRates,
            stageDistribution,
            avgTimeInStage,
        }
    }

    async getTrends(organizationId: string, timeframe: 'week' | 'month' = 'month'): Promise<AnalyticsTrendData[]> {
        // Aggregate applications by day for the last 30 days
        const daysBack = timeframe === 'week' ? 7 : 30
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - daysBack)

        const pipeline = await JobApplication.aggregate([
            {
                $addFields: { orgIdStr: { $toString: '$organizationId' } }
            },
            {
                $match: {
                    orgIdStr: organizationId,
                    submittedAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$submittedAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ])

        // Fill in missing dates with 0
        const result: AnalyticsTrendData[] = []
        for (let i = 0; i < daysBack; i++) {
            const d = new Date()
            d.setDate(d.getDate() - (daysBack - 1 - i))
            const dateStr = d.toISOString().split('T')[0]
            const found = pipeline.find((p: any) => p._id === dateStr)
            result.push({ date: dateStr, value: found ? found.count : 0 })
        }

        return result
    }

    async getDemographics(organizationId: string): Promise<{ device: DemographicsData[], location: DemographicsData[] }> {
        // Aggregate application sources
        const sourceAgg = await JobApplication.aggregate([
            {
                $addFields: { orgIdStr: { $toString: '$organizationId' } }
            },
            { $match: { orgIdStr: organizationId } },
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

        const total = sourceAgg.reduce((sum: number, item: any) => sum + item.count, 0) || 1

        return {
            device: sourceAgg.map((item: any) => ({
                label: item._id,
                value: item.count,
                percentage: Math.round((item.count / total) * 100)
            })),
            location: [] // No location data tracked yet
        }
    }
}

export const analyticsService = new AnalyticsService()
