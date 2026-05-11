import { analyticsService } from '../analytics/analytics.service.js'
import { candidatesService } from '../candidates/candidates.service.js'
import { jobsService } from '../jobs/jobs.service.js'
import { KPIData } from '../analytics/analytics.types.js'

class DashboardService {
    async getSummary(organizationId: string) {
        // reuse analytics for KPIs
        const kpis = await analyticsService.getKPIs(organizationId)

        // get recent candidates
        const recentCandidates = await candidatesService.list(organizationId, {
            page: 1,
            limit: 5
        })

        return {
            kpis,
            recentCandidates: recentCandidates.data
        }
    }

    async getAnalytics(organizationId: string) {
        const [atsAnalytics, trends, demographics, funnel] = await Promise.all([
            analyticsService.getKPIs(organizationId),
            analyticsService.getApplicationVolume(organizationId, 'month'),
            analyticsService.getSourcePerformance(organizationId),
            analyticsService.getFunnelMetrics(organizationId),
        ])

        return {
            ...atsAnalytics,
            hiringTrends: trends,
            applicationSources: demographics,
            stageDistribution: funnel.stageDistribution,
        }
    }
}

export const dashboardService = new DashboardService()

