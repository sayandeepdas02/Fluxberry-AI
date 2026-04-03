"use client"

import { KPICard } from "@/features/dashboard/components/kpi-card"
import { LineChart } from "@/features/dashboard/components/line-chart"
import { HorizontalBarChart } from "@/features/dashboard/components/horizontal-bar-chart"
import { VerticalBarChart } from "@/features/dashboard/components/vertical-bar-chart"
import { DonutChart } from "@/features/dashboard/components/donut-chart"
import { useDashboard } from "@/features/dashboard/hooks/use-dashboard"
import { useAuth } from "@/lib/context/auth-context"
import { Briefcase, FileSearch, CheckSquare, Sparkles, ArrowRight } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export function DashboardOverview() {
    const { user } = useAuth();
    const userName = user?.firstName || "User";
    const { summary, analytics, isLoading, error } = useDashboard()

    if (isLoading) {
        return (
            <div className="space-y-8">
                {/* Welcome skeleton */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-72" />
                        <Skeleton className="h-4 w-56" />
                    </div>
                    <Skeleton className="h-10 w-80" />
                </div>
                {/* Quick action cards skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1,2,3].map(i => (
                        <Skeleton key={i} className="h-[120px] w-full" />
                    ))}
                </div>
                {/* KPI cards skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1,2,3,4].map(i => (
                        <Skeleton key={i} className="h-[100px] w-full" />
                    ))}
                </div>
                {/* Charts skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Skeleton className="lg:col-span-2 h-[280px] w-full" />
                    <Skeleton className="h-[280px] w-full" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Skeleton className="lg:col-span-2 h-[280px] w-full" />
                    <Skeleton className="h-[280px] w-full" />
                </div>
            </div>
        )
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
        <div className="space-y-8">
            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-[28px] font-heading font-semibold tracking-tight text-foreground">
                        Welcome back, {userName}
                    </h1>
                    <p className="text-muted-foreground mt-1 text-[14px]">
                        Here's what's happening in your workspace today.
                    </p>
                </div>
                
                {/* AI Suggestion Chip */}
                <div className="bg-primary/5 border border-primary/20 rounded-none px-4 py-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">
                        AI suggests reviewing 3 new candidates for "Senior Engineer"
                    </span>
                    <button className="text-muted-foreground hover:text-primary ml-1 transition-colors">
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Quick Actions / Mission Control */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <button className="group relative overflow-hidden bg-background border border-line p-6 text-left hover:border-foreground/30 transition-all duration-300">
                    <div className="w-10 h-10 border border-line bg-muted/30 flex items-center justify-center mb-4 transition-colors group-hover:bg-primary/5 group-hover:border-primary/20">
                        <Briefcase className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <h3 className="font-semibold text-[15px] text-foreground mb-1">Create Job</h3>
                    <p className="text-[13px] text-muted-foreground leading-relaxed">Draft and publish a new open role instantly.</p>
                </button>
                
                <button className="group relative overflow-hidden bg-background border border-line p-6 text-left hover:border-foreground/30 transition-all duration-300">
                    <div className="w-10 h-10 border border-line bg-muted/30 flex items-center justify-center mb-4 transition-colors group-hover:bg-primary/5 group-hover:border-primary/20">
                        <FileSearch className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <h3 className="font-semibold text-[15px] text-foreground mb-1">Start Screening</h3>
                    <p className="text-[13px] text-muted-foreground leading-relaxed">Automate inbound ATS filtering using AI.</p>
                </button>

                <button className="group relative overflow-hidden bg-background border border-line p-6 text-left hover:border-foreground/30 transition-all duration-300">
                    <div className="w-10 h-10 border border-line bg-muted/30 flex items-center justify-center mb-4 transition-colors group-hover:bg-primary/5 group-hover:border-primary/20">
                        <CheckSquare className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <h3 className="font-semibold text-[15px] text-foreground mb-1">Create Assessment</h3>
                    <p className="text-[13px] text-muted-foreground leading-relaxed">Build an automated technical interview.</p>
                </button>
            </div>

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

