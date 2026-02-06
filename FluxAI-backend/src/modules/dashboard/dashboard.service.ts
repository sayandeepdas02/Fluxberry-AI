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
            recentCandidates: recentCandidates.candidates
        }
    }
}

export const dashboardService = new DashboardService()
