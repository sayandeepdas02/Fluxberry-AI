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
    totalJobs: number
    activeJobs: number
    totalCandidates: number
    totalApplications: number
    conversionRates: {
        appliedToInterview: number
        interviewToOffer: number
        offerToHired: number
    }
    stageDistribution: Record<string, number>
    avgTimeInStage: Record<string, number>
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

