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

export const analyticsApi = {
    getKPIs: async (): Promise<ApiResponse<AnalyticsKPIResponse>> => {
        return apiClient.get('/analytics/kpis')
    },

    getTrends: async (): Promise<ApiResponse<AnalyticsTrendData[]>> => {
        return apiClient.get('/analytics/trends')
    },

    getDemographics: async (): Promise<ApiResponse<{ device: DemographicsData[], location: DemographicsData[] }>> => {
        return apiClient.get('/analytics/demographics')
    }
}
