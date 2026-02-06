import { apiClient } from './client'
import { ApiResponse } from './types'
import { KPIData } from './analytics'

export interface DashboardSummary {
    kpis: {
        activeJobs: KPIData
        totalCandidates: KPIData
        applications: KPIData
        awaitingReview: KPIData
    }
    recentCandidates: {
        _id: string
        firstName?: string
        lastName?: string
        email: string
        createdAt: string
        source?: string
    }[]
}

export const dashboardApi = {
    summary: async (): Promise<ApiResponse<DashboardSummary>> => {
        return apiClient.get('/dashboard/summary')
    }
}
