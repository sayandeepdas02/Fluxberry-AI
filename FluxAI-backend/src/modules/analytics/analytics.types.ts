import { z } from 'zod'

export interface KPIData {
    label: string
    value: number
    trend: number // percentage change vs previous period
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

// Query parameters for analytics
export const analyticsQuerySchema = z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
})

export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>
