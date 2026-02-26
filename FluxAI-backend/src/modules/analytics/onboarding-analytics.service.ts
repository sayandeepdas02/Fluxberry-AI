import { Offer, Onboarding } from '../../database/models/index.js'
import redis from '../../jobs/redis.js'

export class OnboardingAnalyticsService {

    async getOnboardingMetrics(organizationId: string) {
        const cacheKey = `analytics:onboarding:${organizationId}`
        const cached = await redis.get(cacheKey)
        if (cached) return JSON.parse(cached)

        const [offerMetrics, onboardingMetrics] = await Promise.all([
            this.calculateOfferMetrics(organizationId),
            this.calculateOnboardingCompletion(organizationId)
        ])

        const result = {
            ...offerMetrics,
            ...onboardingMetrics
        }

        // Cache for 1 hour to prevent heavy aggregation hits
        await redis.set(cacheKey, JSON.stringify(result), 'EX', 3600)
        return result
    }

    private async calculateOfferMetrics(organizationId: string) {
        const pipeline = [
            { $match: { organizationId } },
            {
                $group: {
                    _id: null,
                    totalOffers: { $sum: 1 },
                    acceptedOffers: {
                        $sum: { $cond: [{ $eq: ["$status", "SIGNED"] }, 1, 0] }
                    },
                    rejectedOffers: {
                        $sum: { $cond: [{ $eq: ["$status", "REJECTED"] }, 1, 0] }
                    },
                    avgTimeToSign: {
                        $avg: {
                            $cond: [
                                { $eq: ["$status", "SIGNED"] },
                                { $subtract: ["$signedAt", "$createdAt"] },
                                null
                            ]
                        }
                    }
                }
            }
        ]

        const result = await Offer.aggregate(pipeline)
        if (!result.length) return {
            acceptanceRate: 0,
            rejectionRate: 0,
            avgTimeToSignDays: 0,
            totalOffers: 0
        }

        const data = result[0]
        const acceptanceRate = data.totalOffers > 0 ? (data.acceptedOffers / data.totalOffers) * 100 : 0
        const rejectionRate = data.totalOffers > 0 ? (data.rejectedOffers / data.totalOffers) * 100 : 0
        const avgTimeToSignDays = data.avgTimeToSign ? data.avgTimeToSign / (1000 * 60 * 60 * 24) : 0

        return {
            acceptanceRate: Math.round(acceptanceRate * 10) / 10,
            rejectionRate: Math.round(rejectionRate * 10) / 10,
            avgTimeToSignDays: Math.round(avgTimeToSignDays * 10) / 10,
            totalOffers: data.totalOffers
        }
    }

    private async calculateOnboardingCompletion(organizationId: string) {
        const pipeline = [
            { $match: { organizationId } },
            {
                $group: {
                    _id: null,
                    totalOnboardings: { $sum: 1 },
                    completed: {
                        $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] }
                    },
                    inProgress: {
                        $sum: { $cond: [{ $eq: ["$status", "IN_PROGRESS"] }, 1, 0] }
                    },
                    avgTimeToComplete: {
                        $avg: {
                            $cond: [
                                { $eq: ["$status", "COMPLETED"] },
                                { $subtract: ["$completedAt", "$startDate"] },
                                null
                            ]
                        }
                    }
                }
            }
        ]

        const result = await Onboarding.aggregate(pipeline)
        if (!result.length) return {
            completionRate: 0,
            avgTimeToCompleteDays: 0,
            totalOnboardings: 0,
            inProgressOnboardings: 0
        }

        const data = result[0]
        const completionRate = data.totalOnboardings > 0 ? (data.completed / data.totalOnboardings) * 100 : 0
        const avgTimeToCompleteDays = data.avgTimeToComplete ? data.avgTimeToComplete / (1000 * 60 * 60 * 24) : 0

        return {
            completionRate: Math.round(completionRate * 10) / 10,
            avgTimeToCompleteDays: Math.round(avgTimeToCompleteDays * 10) / 10,
            totalOnboardings: data.totalOnboardings,
            inProgressOnboardings: data.inProgress
        }
    }
}

export const onboardingAnalyticsService = new OnboardingAnalyticsService()
