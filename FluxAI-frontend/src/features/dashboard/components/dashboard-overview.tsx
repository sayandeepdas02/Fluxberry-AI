"use client"

import { KPICard } from "@/features/dashboard/components/kpi-card"
import { LineChart } from "@/features/dashboard/components/line-chart"
import { HorizontalBarChart } from "@/features/dashboard/components/horizontal-bar-chart"
import { VerticalBarChart } from "@/features/dashboard/components/vertical-bar-chart"
import { DonutChart } from "@/features/dashboard/components/donut-chart"
import { hiringActivityData, applicationSourcesData, trafficByDeviceData, trafficByLocationData } from "@/features/dashboard/mocks/dashboard"
import { useDashboard } from "@/features/dashboard/hooks/use-dashboard"

export function DashboardOverview() {
    const { summary, isLoading, error } = useDashboard()

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Loading dashboard...</div>
    }

    if (error) {
        return <div className="p-8 text-center text-destructive">Error: {error}</div>
    }

    const { kpis } = summary || {
        kpis: {
            activeJobs: { label: 'Active Jobs', value: 0, trend: 0, trendDirection: 'neutral' },
            totalCandidates: { label: 'Total Candidates', value: 0, trend: 0, trendDirection: 'neutral' },
            applications: { label: 'Total Applications', value: 0, trend: 0, trendDirection: 'neutral' },
            awaitingReview: { label: 'Awaiting Review', value: 0, trend: 0, trendDirection: 'neutral' }
        }
    } as any

    return (
        <div className="space-y-6">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    title="Active Jobs"
                    value={kpis.activeJobs.value.toLocaleString()}
                    trend={kpis.activeJobs.trend}
                />
                <KPICard
                    title="Total Candidates"
                    value={kpis.totalCandidates.value.toLocaleString()}
                    trend={kpis.totalCandidates.trend}
                />
                <KPICard
                    title="Applications"
                    value={kpis.applications.value.toLocaleString()}
                    trend={kpis.applications.trend}
                />
                <KPICard
                    title="Awaiting Review"
                    value={kpis.awaitingReview.value.toLocaleString()}
                    trend={kpis.awaitingReview.trend}
                />
            </div>

            {/* Middle Section: Trends + Sources */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Hiring Activity / Total Users Trend - Spans 2 cols */}
                <div className="lg:col-span-2">
                    <LineChart data={hiringActivityData} />
                </div>

                {/* Application Sources - Spans 1 col */}
                <div className="lg:col-span-1 h-full">
                    <HorizontalBarChart data={applicationSourcesData} />
                </div>
            </div>

            {/* Lower Section: Device Traffic + Location */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Traffic by Device - Spans 2 cols */}
                <div className="lg:col-span-2">
                    <VerticalBarChart data={trafficByDeviceData} />
                </div>

                {/* Traffic by Location - Spans 1 col */}
                <div className="lg:col-span-1">
                    <DonutChart data={trafficByLocationData} />
                </div>
            </div>
        </div>
    )
}
