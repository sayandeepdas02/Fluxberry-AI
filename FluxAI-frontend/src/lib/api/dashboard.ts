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

export interface ATSAnalytics {
    // KPI-shaped fields from the analytics service spread
    activeJobs: { label: string; value: number; trend: number; trendDirection: string }
    totalCandidates: { label: string; value: number; trend: number; trendDirection: string }
    applications: { label: string; value: number; trend: number; trendDirection: string }
    awaitingReview: { label: string; value: number; trend: number; trendDirection: string }
    // Trend / source data appended by dashboard.service
    hiringTrends: { date: string; value: number }[]
    applicationSources: { label: string; value: number; percentage: number }[]
}

export const dashboardApi = {
    summary: async (): Promise<ApiResponse<DashboardSummary>> => {
        return apiClient.get('/dashboard/summary')
    },

    analytics: async (): Promise<ApiResponse<ATSAnalytics>> => {
        return apiClient.get('/dashboard/analytics')
    },
}

