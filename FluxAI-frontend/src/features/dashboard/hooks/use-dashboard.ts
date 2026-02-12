'use client'

import { useState, useEffect, useCallback } from 'react'
import { dashboardApi, DashboardSummary, ATSAnalytics } from '@/lib/api/dashboard'

interface UseDashboardResult {
    summary: DashboardSummary | null
    analytics: ATSAnalytics | null
    isLoading: boolean
    error: string | null
    refetch: () => Promise<void>
}

export function useDashboard(): UseDashboardResult {
    const [summary, setSummary] = useState<DashboardSummary | null>(null)
    const [analytics, setAnalytics] = useState<ATSAnalytics | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchData = useCallback(async () => {
        setIsLoading(true)
        setError(null)

        const [summaryRes, analyticsRes] = await Promise.all([
            dashboardApi.summary(),
            dashboardApi.analytics(),
        ])

        if (summaryRes.success && summaryRes.data) {
            setSummary(summaryRes.data)
        } else {
            setError(summaryRes.error?.message || 'Failed to load dashboard summary')
        }

        if (analyticsRes.success && analyticsRes.data) {
            setAnalytics(analyticsRes.data)
        }

        setIsLoading(false)
    }, [])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    return {
        summary,
        analytics,
        isLoading,
        error,
        refetch: fetchData
    }
}

