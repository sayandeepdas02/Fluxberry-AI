'use client'

import { useQuery } from '@tanstack/react-query'
import { analyticsApi, AnalyticsKPIResponse, AnalyticsTrendData, DemographicsData } from '@/lib/api/analytics'
import { ApiError } from '@/lib/api/client'
import { analyticsKeys } from '@/lib/query/queryKeys'

export { analyticsKeys }

export function useAnalytics() {
    const kpisQuery = useQuery({
        queryKey: analyticsKeys.kpis(),
        queryFn: async () => {
            const res = await analyticsApi.getKPIs()
            if (!res.success) throw new ApiError(res.error?.message ?? 'Failed to load KPIs', res.error?.code ?? 'UNKNOWN', res.error?.details)
            return res.data!
        },
        staleTime: 2 * 60 * 1000,
    })

    const trendsQuery = useQuery({
        queryKey: analyticsKeys.trends(),
        queryFn: async () => {
            const res = await analyticsApi.getTrends()
            if (!res.success) throw new ApiError(res.error?.message ?? 'Failed to load trends', res.error?.code ?? 'UNKNOWN', res.error?.details)
            return res.data!
        },
        staleTime: 5 * 60 * 1000, // Trends change slowly — 5 min cache
    })

    const demographicsQuery = useQuery({
        queryKey: analyticsKeys.demographics(),
        queryFn: async () => {
            const res = await analyticsApi.getDemographics()
            if (!res.success) throw new ApiError(res.error?.message ?? 'Failed to load demographics', res.error?.code ?? 'UNKNOWN', res.error?.details)
            return res.data!
        },
        staleTime: 5 * 60 * 1000,
    })

    const error = kpisQuery.error
        ? (kpisQuery.error as Error).message
        : trendsQuery.error
            ? (trendsQuery.error as Error).message
            : demographicsQuery.error
                ? (demographicsQuery.error as Error).message
                : null

    // ── Backward-compatible surface ──────────────────────────────────────────
    return {
        kpis: kpisQuery.data ?? null,
        trends: trendsQuery.data ?? [],
        demographics: demographicsQuery.data ?? null,
        isLoading: kpisQuery.isLoading || trendsQuery.isLoading || demographicsQuery.isLoading,
        error,
        refetch: async () => {
            await Promise.all([
                kpisQuery.refetch(),
                trendsQuery.refetch(),
                demographicsQuery.refetch(),
            ])
        },
    }
}
