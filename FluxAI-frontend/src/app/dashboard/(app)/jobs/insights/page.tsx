"use client"

import { PageContainer } from "@/components/dashboard/page-container"
import { useQuery } from "@tanstack/react-query"
import { jobsApi, Job } from "@/lib/api/jobs"
import { analyticsApi } from "@/lib/api/analytics"
import { EmptyState } from "@/components/dashboard/empty-state"
import { Skeleton } from "@/components/dashboard/skeleton"
import { TrendingUp, Briefcase, Users, Clock, BarChart3 } from "lucide-react"

export default function JobInsightsPage() {
    const { data: jobsRes, isLoading: jobsLoading } = useQuery({
        queryKey: ['jobs', 'all-insights'],
        queryFn: () => jobsApi.list({ limit: 100 }),
    })

    const { data: funnelRes } = useQuery({
        queryKey: ['analytics', 'funnel'],
        queryFn: () => analyticsApi.getFunnel(),
    })

    const { data: tthRes } = useQuery({
        queryKey: ['analytics', 'time-to-hire'],
        queryFn: () => analyticsApi.getTimeToHire(),
    })

    const jobs = (jobsRes?.data || []) as Job[]
    const funnel = funnelRes?.data
    const tth = tthRes?.data

    const published = jobs.filter(j => j.status === 'PUBLISHED').length
    const totalApps = jobs.reduce((a, j) => a + (j.applicationCount || 0), 0)
    const avgApps = jobs.length > 0 ? Math.round(totalApps / jobs.length) : 0

    if (jobsLoading) {
        return (
            <PageContainer title="Job Insights" description="Analyze job performance and sourcing channels.">
                <div className="mt-6 space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
                </div>
            </PageContainer>
        )
    }

    if (jobs.length === 0) {
        return (
            <PageContainer title="Job Insights" description="Analyze job performance and sourcing channels.">
                <EmptyState icon={TrendingUp} title="No insights available" description="Post jobs and receive applications to start seeing performance insights." />
            </PageContainer>
        )
    }

    return (
        <PageContainer title="Job Insights" description="Analyze job performance and sourcing channels.">
            <div className="mt-6 w-full space-y-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 border border-line rounded-lg bg-card/50 text-center">
                        <Briefcase className="w-5 h-5 mx-auto text-accent mb-1" />
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Jobs</p>
                        <p className="text-2xl font-bold mt-0.5">{jobs.length}</p>
                    </div>
                    <div className="p-4 border border-line rounded-lg bg-card/50 text-center">
                        <TrendingUp className="w-5 h-5 mx-auto text-emerald-400 mb-1" />
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Active</p>
                        <p className="text-2xl font-bold mt-0.5 text-emerald-400">{published}</p>
                    </div>
                    <div className="p-4 border border-line rounded-lg bg-card/50 text-center">
                        <Users className="w-5 h-5 mx-auto text-blue-400 mb-1" />
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Applications</p>
                        <p className="text-2xl font-bold mt-0.5">{totalApps}</p>
                    </div>
                    <div className="p-4 border border-line rounded-lg bg-card/50 text-center">
                        <BarChart3 className="w-5 h-5 mx-auto text-amber-400 mb-1" />
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg Per Job</p>
                        <p className="text-2xl font-bold mt-0.5">{avgApps}</p>
                    </div>
                </div>

                {/* Per-job breakdown */}
                <div className="border border-line rounded-lg bg-card/50 p-4 space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Job Performance</h4>
                    <div className="space-y-2">
                        {jobs.sort((a, b) => (b.applicationCount || 0) - (a.applicationCount || 0)).map(job => (
                            <div key={job._id} className="flex items-center justify-between p-3 bg-muted/10 rounded-lg">
                                <div>
                                    <p className="text-sm font-medium">{job.title}</p>
                                    <p className="text-[10px] text-muted-foreground">{job.department || 'No dept'} · {job.status}</p>
                                </div>
                                <div className="flex items-center gap-3 text-right">
                                    <div>
                                        <p className="text-lg font-bold">{job.applicationCount || 0}</p>
                                        <p className="text-[10px] text-muted-foreground">applications</p>
                                    </div>
                                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-accent rounded-full transition-all"
                                            style={{ width: `${Math.min(100, ((job.applicationCount || 0) / Math.max(1, totalApps)) * 100 * jobs.length)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Time to hire */}
                {tth && (
                    <div className="border border-line rounded-lg bg-card/50 p-4">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" /> Average Time to Hire
                        </h4>
                        <p className="text-3xl font-bold">{tth.avgDays || '—'} <span className="text-sm text-muted-foreground font-normal">days</span></p>
                    </div>
                )}
            </div>
        </PageContainer>
    )
}
