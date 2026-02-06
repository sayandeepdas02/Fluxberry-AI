'use client'

import { useState, useEffect, useCallback } from 'react'
import { dashboardApi, DashboardSummary } from '@/lib/api/dashboard'

interface UseDashboardResult {
    summary: DashboardSummary | null
    isLoading: boolean
    error: string | null
    refetch: () => Promise<void>
}

export function useDashboard(): UseDashboardResult {
    const [summary, setSummary] = useState<DashboardSummary | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchSummary = useCallback(async () => {
        setIsLoading(true)
        setError(null)

        const response = await dashboardApi.summary()

        if (response.success && response.data) {
            setSummary(response.data)
        } else {
            setError(response.error?.message || 'Failed to load dashboard summary')
        }

        setIsLoading(false)
    }, [])

    useEffect(() => {
        fetchSummary()
    }, [fetchSummary])

    return {
        summary,
        isLoading,
        error,
        refetch: fetchSummary
    }
}
