'use client'

import { useQuery } from '@tanstack/react-query'
import { dashboardApi, DashboardSummary, ATSAnalytics } from '@/lib/api/dashboard'
import { ApiError } from '@/lib/api/client'
import { toast } from 'sonner'
import { dashboardKeys } from '@/lib/query/queryKeys'

export { dashboardKeys }

export function useDashboard() {
    const summaryQuery = useQuery({
        queryKey: dashboardKeys.summary(),
        queryFn: async () => {
            const res = await dashboardApi.summary()
            if (!res.success) throw new ApiError(res.error?.message ?? 'Failed to load dashboard summary', res.error?.code ?? 'UNKNOWN', res.error?.details)
            return res.data!
        },
        // Dashboard summary is polled every 60s while the tab is visible
        refetchInterval: 60 * 1000,
    })

    const analyticsQuery = useQuery({
        queryKey: dashboardKeys.analytics(),
        queryFn: async () => {
            const res = await dashboardApi.analytics()
            if (!res.success) throw new ApiError(res.error?.message ?? 'Failed to load analytics', res.error?.code ?? 'UNKNOWN', res.error?.details)
            return res.data!
        },
        staleTime: 2 * 60 * 1000, // Analytics can be 2 min stale
    })

    // Surface toast on first error per session
    const combinedError = summaryQuery.error
        ? (summaryQuery.error as Error).message
        : analyticsQuery.error
            ? (analyticsQuery.error as Error).message
            : null

    if (combinedError && !summaryQuery.isStale) {
        // Only log — callers access error prop for display
        console.error('[useDashboard]', combinedError)
    }

    // ── Backward-compatible surface ──────────────────────────────────────────
    return {
        summary: summaryQuery.data ?? null,
        analytics: analyticsQuery.data ?? null,
        isLoading: summaryQuery.isLoading || analyticsQuery.isLoading,
        error: combinedError,
        refetch: async () => {
            await Promise.all([summaryQuery.refetch(), analyticsQuery.refetch()])
        },
    }
}
