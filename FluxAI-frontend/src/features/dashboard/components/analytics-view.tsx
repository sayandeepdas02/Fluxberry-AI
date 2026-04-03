"use client"

import { KPICard } from "@/features/dashboard/components/kpi-card"
import { LineChart } from "@/features/dashboard/components/line-chart"
import { HorizontalBarChart } from "@/features/dashboard/components/horizontal-bar-chart"
import { VerticalBarChart } from "@/features/dashboard/components/vertical-bar-chart"
import { DonutChart } from "@/features/dashboard/components/donut-chart"
import { useAnalytics } from "@/features/dashboard/hooks/use-analytics"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertTriangle } from "lucide-react"

// Static campaign data — no backend entity for campaigns yet (tracked in roadmap)
const campaignPerformanceData = [
    { name: 'Senior Dev Outreach', value: 45 },
    { name: 'Q1 Hiring Drive', value: 30 },
    { name: 'University Mixer', value: 15 },
    { name: 'Tech Talk Series', value: 8 },
    { name: 'Other', value: 2 },
]

export function AnalyticsView() {
    const { kpis, trends, demographics, isLoading, error } = useAnalytics()

    if (isLoading) {
        return (
            <div className="flex flex-col space-y-6">
                {/* KPI skeleton row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-28 rounded-lg" />
                    ))}
                </div>
                {/* Charts skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Skeleton className="lg:col-span-2 h-64 rounded-lg" />
                    <Skeleton className="h-64 rounded-lg" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Skeleton className="lg:col-span-2 h-64 rounded-lg" />
                    <Skeleton className="h-64 rounded-lg" />
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-destructive/30 rounded-lg bg-destructive/5 min-h-[300px]">
                <AlertTriangle className="w-10 h-10 text-destructive mb-4" />
                <h3 className="text-lg font-semibold mb-2">Analytics failed to load</h3>
                <p className="text-sm text-muted-foreground max-w-sm">{error}</p>
            </div>
        )
    }

    // Transform trends for LineChart
    // Assuming trends is [{ date: '2024-01-01', value: 10 }, ...]
    // We need to map to "months" (or labels) and "thisYear"
    const formattedTrends = {
        months: trends.length > 0 ? trends.map(t => {
            const d = new Date(t.date)
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }) : ['No Data'],
        thisYear: trends.length > 0 ? trends.map(t => t.value) : [0],
        lastYear: trends.length > 0 ? trends.map(() => 0) : [0], // No historical data yet
    }

    // Fallback if KPIs are null
    const safeKpis = kpis || {
        activeJobs: { label: 'Active Jobs', value: 0, trend: 0, trendDirection: 'neutral' },
        totalCandidates: { label: 'Total Candidates', value: 0, trend: 0, trendDirection: 'neutral' },
        applications: { label: 'Total Applications', value: 0, trend: 0, trendDirection: 'neutral' },
        awaitingReview: { label: 'Awaiting Review', value: 0, trend: 0, trendDirection: 'neutral' },
    } as any

    return (
        <div className="flex flex-col space-y-6">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-1">
                <span>Flux Hire</span>
                <span>/</span>
                <span>Analytics</span>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                    title={safeKpis.activeJobs.label}
                    value={safeKpis.activeJobs.value.toLocaleString()}
                    trend={safeKpis.activeJobs.trend}
                />
                <KPICard
                    title={safeKpis.totalCandidates.label}
                    value={safeKpis.totalCandidates.value.toLocaleString()}
                    trend={safeKpis.totalCandidates.trend}
                />
                <KPICard
                    title={safeKpis.applications.label}
                    value={safeKpis.applications.value.toLocaleString()}
                    trend={safeKpis.applications.trend}
                />
                <KPICard
                    title={safeKpis.awaitingReview.label}
                    value={safeKpis.awaitingReview.value.toLocaleString()}
                    trend={safeKpis.awaitingReview.trend}
                />
            </div>

            {/* Main Chart Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Engagement Trend (Line Chart) */}
                <div className="lg:col-span-2">
                    <LineChart
                        data={formattedTrends}
                    />
                </div>

                {/* Campaign Performance (Horizontal Bar) */}
                <div className="lg:col-span-1">
                    <HorizontalBarChart
                        data={campaignPerformanceData}
                    />
                </div>
            </div>

            {/* Secondary Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <VerticalBarChart data={demographics?.device.map(d => ({ device: d.label, count: d.value })) || []} />
                </div>
                <div className="lg:col-span-1">
                    <DonutChart data={demographics?.location.map(d => ({ country: d.label, percentage: d.percentage })) || []} />
                </div>
            </div>

        </div>
    )
}
