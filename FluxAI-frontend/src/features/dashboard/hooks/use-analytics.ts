'use client'

import { useState, useEffect, useCallback } from 'react'
import { analyticsApi, AnalyticsKPIResponse, AnalyticsTrendData, DemographicsData } from '@/lib/api/analytics'

interface UseAnalyticsResult {
    kpis: AnalyticsKPIResponse | null
    trends: AnalyticsTrendData[]
    demographics: { device: DemographicsData[], location: DemographicsData[] } | null
    isLoading: boolean
    error: string | null
    refetch: () => Promise<void>
}

export function useAnalytics(): UseAnalyticsResult {
    const [kpis, setKpis] = useState<AnalyticsKPIResponse | null>(null)
    const [trends, setTrends] = useState<AnalyticsTrendData[]>([])
    const [demographics, setDemographics] = useState<{ device: DemographicsData[], location: DemographicsData[] } | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchAnalytics = useCallback(async () => {
        setIsLoading(true)
        setError(null)

        try {
            const [kpiRes, trendRes, demoRes] = await Promise.all([
                analyticsApi.getKPIs(),
                analyticsApi.getTrends(),
                analyticsApi.getDemographics()
            ])

            if (kpiRes.success && kpiRes.data) {
                setKpis(kpiRes.data)
            }
            if (trendRes.success && trendRes.data) {
                setTrends(trendRes.data)
            }
            if (demoRes.success && demoRes.data) {
                setDemographics(demoRes.data)
            }
        } catch (err) {
            setError('Failed to load analytics data')
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchAnalytics()
    }, [fetchAnalytics])

    return {
        kpis,
        trends,
        demographics,
        isLoading,
        error,
        refetch: fetchAnalytics
    }
}
