"use client"

import { KPICard } from "@/features/dashboard/components/kpi-card"
import { LineChart } from "@/features/dashboard/components/line-chart"
import { HorizontalBarChart } from "@/features/dashboard/components/horizontal-bar-chart"
import { VerticalBarChart } from "@/features/dashboard/components/vertical-bar-chart"
import { DonutChart } from "@/features/dashboard/components/donut-chart"
import { useDashboard } from "@/features/dashboard/hooks/use-dashboard"

export function DashboardOverview() {
    const { summary, analytics, isLoading, error } = useDashboard()

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

    // Transform analytics data for chart components
    const hiringActivityData = analytics?.hiringTrends
        ? {
            months: analytics.hiringTrends.slice(-7).map(t => {
                const d = new Date(t.date)
                return d.toLocaleDateString('en-US', { month: 'short' })
            }),
            thisYear: analytics.hiringTrends.slice(-7).map(t => t.value),
            lastYear: analytics.hiringTrends.slice(-7).map(() => 0), // No historical comparison yet
        }
        : { months: ['Jan'], thisYear: [0], lastYear: [0] }

    const applicationSourcesData = analytics?.applicationSources?.map(s => ({
        name: s.label,
        value: s.value,
    })) || []

    const stageDistributionData = analytics?.stageDistribution
        ? Object.entries(analytics.stageDistribution).map(([stage, count]) => ({
            device: stage,
            count: count,
        }))
        : []

    const conversionData = analytics?.conversionRates
        ? [
            { country: 'Applied→Interview', percentage: analytics.conversionRates.appliedToInterview },
            { country: 'Interview→Offer', percentage: analytics.conversionRates.interviewToOffer },
            { country: 'Offer→Hired', percentage: analytics.conversionRates.offerToHired },
            { country: 'Other', percentage: Math.max(0, 100 - analytics.conversionRates.appliedToInterview - analytics.conversionRates.interviewToOffer - analytics.conversionRates.offerToHired) },
        ]
        : [{ country: 'No Data', percentage: 100 }]

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
                <div className="lg:col-span-2">
                    <LineChart data={hiringActivityData} />
                </div>
                <div className="lg:col-span-1 h-full">
                    <HorizontalBarChart data={applicationSourcesData} />
                </div>
            </div>

            {/* Lower Section: Stage Distribution + Conversion */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <VerticalBarChart data={stageDistributionData} />
                </div>
                <div className="lg:col-span-1">
                    <DonutChart data={conversionData} />
                </div>
            </div>
        </div>
    )
}

