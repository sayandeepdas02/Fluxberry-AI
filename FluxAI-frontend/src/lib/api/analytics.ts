import { apiClient } from './client'
import { ApiResponse } from './types'

export interface KPIData {
    label: string
    value: number
    trend: number
    trendDirection: 'up' | 'down' | 'neutral'
}

export interface AnalyticsTrendData {
    date: string
    value: number
    category?: string
}

export interface DemographicsData {
    label: string
    value: number
    percentage: number
}

export interface AnalyticsKPIResponse {
    activeJobs: KPIData
    totalCandidates: KPIData
    applications: KPIData
    awaitingReview: KPIData
}

export interface AnalyticsFunnelResponse {
    stageDistribution: Record<string, number>
    conversionRates: {
        appliedToInterview: number
        interviewToOffer: number
        offerToHired: number
    }
}

export interface AnalyticsTimeToHireResponse {
    avgDays: number
    min: number
    max: number
}

export interface AtsEfficiencyResponse {
    hoursSaved: number
    totalScreened: number
    scoreDistribution: { range: string; count: number }[]
}

export const analyticsApi = {
    getKPIs: async (jobId?: string): Promise<ApiResponse<AnalyticsKPIResponse>> => {
        return apiClient.get('/analytics/kpis', { jobId })
    },

    getTrends: async (timeframe: 'week' | 'month' = 'month', jobId?: string): Promise<ApiResponse<AnalyticsTrendData[]>> => {
        return apiClient.get('/analytics/trends', { timeframe, jobId })
    },

    getDemographics: async (jobId?: string): Promise<ApiResponse<{ device: DemographicsData[], location: DemographicsData[] }>> => {
        return apiClient.get('/analytics/demographics', { jobId })
    },

    getFunnel: async (jobId?: string): Promise<ApiResponse<AnalyticsFunnelResponse>> => {
        return apiClient.get('/analytics/funnel', { jobId })
    },

    getTimeToHire: async (jobId?: string): Promise<ApiResponse<AnalyticsTimeToHireResponse>> => {
        return apiClient.get('/analytics/time-to-hire', { jobId })
    },

    getAtsEfficiency: async (jobId?: string): Promise<ApiResponse<AtsEfficiencyResponse>> => {
        return apiClient.get('/analytics/ats-efficiency', { jobId })
    }
}
