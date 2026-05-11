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

export interface ConversionRates {
    appliedToInterview: number
    interviewToOffer: number
    offerToHired: number
}

export interface ATSAnalytics {
    // KPI fields (spread from analytics.getKPIs)
    activeJobs: KPIData
    totalCandidates: KPIData
    applications: KPIData
    awaitingReview: KPIData
    // Trend + source data
    hiringTrends: { date: string; value: number }[]
    applicationSources: { label: string; value: number; percentage: number }[]
    // Funnel data (from analytics.getFunnelMetrics)
    stageDistribution?: Record<string, number>
    conversionRates?: ConversionRates
    // Per-stage average time in days (optional — only present if backend computes it)
    avgTimeInStage?: Record<string, number>
}

export const dashboardApi = {
    summary: async (): Promise<ApiResponse<DashboardSummary>> => {
        return apiClient.get('/dashboard/summary')
    },

    analytics: async (): Promise<ApiResponse<ATSAnalytics>> => {
        return apiClient.get('/dashboard/analytics')
    },
}

