"use client"

import { KPICard } from "@/features/dashboard/components/kpi-card"
import { LineChart } from "@/features/dashboard/components/line-chart"
import { HorizontalBarChart } from "@/features/dashboard/components/horizontal-bar-chart"
import { VerticalBarChart } from "@/features/dashboard/components/vertical-bar-chart"
import { DonutChart } from "@/features/dashboard/components/donut-chart"
import { useAnalytics } from "@/features/dashboard/hooks/use-analytics"

// Keep this mock for now as we don't have Campaign entity
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
        return <div className="p-8 text-center text-muted-foreground">Loading analytics...</div>
    }

    if (error) {
        return <div className="p-8 text-center text-destructive">Error: {error}</div>
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
