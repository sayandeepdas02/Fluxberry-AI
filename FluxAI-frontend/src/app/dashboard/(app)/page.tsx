"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { dashboardApi } from "@/lib/api/dashboard"
import { analyticsApi } from "@/lib/api/analytics"
import { useAuth } from "@/lib/context/auth-context"
import {
    Briefcase, Users, ArrowRight, Sparkles,
    TrendingUp, TrendingDown, Minus, AlertCircle,
} from "lucide-react"

// ── Skeleton ───────────────────────────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
    return <div className={`animate-pulse rounded bg-muted ${className}`} />
}

// ── Trend badge ────────────────────────────────────────────────────────────────
function TrendBadge({ trend, direction }: { trend: number; direction: string }) {
    const isUp = direction === "up"
    const isDown = direction === "down"
    return (
        <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium ${isUp ? "text-emerald-400" : isDown ? "text-red-400" : "text-muted-foreground"}`}>
            {isUp ? <TrendingUp className="w-3 h-3" /> : isDown ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
            {Math.abs(trend)}%
        </span>
    )
}

// ── KPI stat card ──────────────────────────────────────────────────────────────
function StatCard({ label, value, trend, direction, loading }: {
    label: string; value: number; trend: number; direction: string; loading: boolean
}) {
    return (
        <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            {loading ? (
                <Skeleton className="mt-2 h-7 w-16" />
            ) : (
                <div className="mt-1 flex items-end gap-2">
                    <span className="text-2xl font-semibold text-foreground">{value}</span>
                    <TrendBadge trend={trend} direction={direction} />
                </div>
            )}
        </div>
    )
}

// ── Empty state ────────────────────────────────────────────────────────────────
function Empty({ text }: { text: string }) {
    return (
        <p className="py-6 text-center text-sm text-muted-foreground">{text}</p>
    )
}

export default function DashboardHomePage() {
    const { user, organization } = useAuth()

    const { data: summaryRes, isLoading: summaryLoading } = useQuery({
        queryKey: ["dashboard-summary"],
        queryFn: () => dashboardApi.summary(),
        retry: 1,
    })

    const { data: kpiRes, isLoading: kpiLoading } = useQuery({
        queryKey: ["analytics-kpis"],
        queryFn: () => analyticsApi.getKPIs(),
        retry: 1,
    })

    const { data: funnelRes, isLoading: funnelLoading } = useQuery({
        queryKey: ["analytics-funnel"],
        queryFn: () => analyticsApi.getFunnel(),
        retry: 1,
    })

    const summary = summaryRes?.data ?? null
    const kpis = kpiRes?.data ?? null
    const funnel = funnelRes?.data ?? null

    const firstName = user?.firstName ?? "there"

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* Greeting */}
            <div>
                <h1 className="text-xl font-semibold text-foreground">Good morning, {firstName}</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                    {organization?.name ?? "Your workspace"} · Here&apos;s what&apos;s happening today.
                </p>
            </div>

            {/* KPI row */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard
                    label="Active Jobs"
                    value={kpis?.activeJobs?.value ?? 0}
                    trend={kpis?.activeJobs?.trend ?? 0}
                    direction={kpis?.activeJobs?.trendDirection ?? "neutral"}
                    loading={kpiLoading}
                />
                <StatCard
                    label="Total Candidates"
                    value={kpis?.totalCandidates?.value ?? 0}
                    trend={kpis?.totalCandidates?.trend ?? 0}
                    direction={kpis?.totalCandidates?.trendDirection ?? "neutral"}
                    loading={kpiLoading}
                />
                <StatCard
                    label="Applications"
                    value={kpis?.applications?.value ?? 0}
                    trend={kpis?.applications?.trend ?? 0}
                    direction={kpis?.applications?.trendDirection ?? "neutral"}
                    loading={kpiLoading}
                />
                <StatCard
                    label="Awaiting Review"
                    value={kpis?.awaitingReview?.value ?? 0}
                    trend={kpis?.awaitingReview?.trend ?? 0}
                    direction={kpis?.awaitingReview?.trendDirection ?? "neutral"}
                    loading={kpiLoading}
                />
            </div>

            {/* 2-column grid */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

                {/* Widget 1 — Active Jobs */}
                <div className="rounded-xl border border-border bg-card p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-primary" />
                            <h2 className="text-sm font-semibold text-foreground">Active Jobs</h2>
                        </div>
                        <Link href="/dashboard/jobs" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                            View all <ArrowRight className="h-3 w-3" />
                        </Link>
                    </div>
                    {summaryLoading ? (
                        <div className="space-y-2">
                            {[1, 2, 3].map(i => <Skeleton key={i} className="h-8 w-full" />)}
                        </div>
                    ) : summary?.recentCandidates?.length === 0 || !summary ? (
                        <Empty text="No active jobs yet. Create your first job to get started." />
                    ) : (
                        <div className="space-y-1">
                            {/* Placeholder rows — real job list would come from a jobs API call */}
                            <Link href="/dashboard/jobs" className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-muted transition-colors">
                                <span className="text-sm text-foreground">View all open positions</span>
                                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                            </Link>
                        </div>
                    )}
                    <div className="mt-4 pt-4 border-t border-border">
                        <Link
                            href="/dashboard/jobs/create"
                            className="text-xs font-medium text-primary hover:underline"
                        >
                            + Create new job
                        </Link>
                    </div>
                </div>

                {/* Widget 2 — Hiring Funnel */}
                <div className="rounded-xl border border-border bg-card p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <h2 className="text-sm font-semibold text-foreground">Hiring Funnel</h2>
                    </div>
                    {funnelLoading ? (
                        <div className="space-y-3">
                            {["Applied", "Screened", "Assessed", "Offered", "Hired"].map(s => (
                                <div key={s} className="flex items-center gap-3">
                                    <span className="w-16 text-xs text-muted-foreground">{s}</span>
                                    <Skeleton className="h-3 flex-1" />
                                </div>
                            ))}
                        </div>
                    ) : !funnel ? (
                        <Empty text="Pipeline will populate as candidates apply." />
                    ) : (
                        <div className="space-y-3">
                            {Object.entries(funnel.stageDistribution ?? {}).map(([stage, count]) => (
                                <div key={stage} className="flex items-center gap-3">
                                    <span className="w-20 text-xs capitalize text-muted-foreground">{stage.toLowerCase()}</span>
                                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-primary transition-all"
                                            style={{ width: `${Math.min(100, ((count as number) / Math.max(...Object.values(funnel.stageDistribution ?? {}) as number[])) * 100)}%` }}
                                        />
                                    </div>
                                    <span className="w-6 text-right text-xs text-muted-foreground">{count as number}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Widget 3 — Pending Actions */}
                <div className="rounded-xl border border-border bg-card p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                        <h2 className="text-sm font-semibold text-foreground">Pending Actions</h2>
                    </div>
                    {summaryLoading ? (
                        <div className="space-y-2">
                            {[1, 2].map(i => <Skeleton key={i} className="h-9 w-full" />)}
                        </div>
                    ) : (
                        <Empty text="No pending actions." />
                    )}
                </div>

                {/* Widget 4 — Berry AI */}
                <div className="rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 p-5 text-white">
                    <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="h-4 w-4" />
                        <h2 className="text-sm font-semibold">Berry AI</h2>
                    </div>
                    <p className="text-sm text-white/80 mb-4 leading-relaxed">
                        Ask Berry AI to automate your hiring workflow — sourcing, screening, scheduling, and more.
                    </p>
                    <Link
                        href="/dashboard/berry-ai"
                        className="inline-flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/30 transition-colors"
                    >
                        Open Berry AI <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                </div>

                {/* Widget 5 — Recent Candidates — full width */}
                <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-primary" />
                            <h2 className="text-sm font-semibold text-foreground">Recent Candidates</h2>
                        </div>
                        <Link href="/dashboard/pipeline" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                            View pipeline <ArrowRight className="h-3 w-3" />
                        </Link>
                    </div>

                    {summaryLoading ? (
                        <div className="space-y-2">
                            {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
                        </div>
                    ) : !summary?.recentCandidates?.length ? (
                        <Empty text="No candidates yet. Share your job link to get started." />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border text-xs text-muted-foreground">
                                        <th className="pb-2 text-left font-medium">Name</th>
                                        <th className="pb-2 text-left font-medium">Email</th>
                                        <th className="pb-2 text-left font-medium">Added</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {summary.recentCandidates.slice(0, 5).map((c) => (
                                        <tr key={c._id} className="hover:bg-muted/50 transition-colors">
                                            <td className="py-2.5 font-medium text-foreground">
                                                {c.firstName ?? ""} {c.lastName ?? ""}
                                            </td>
                                            <td className="py-2.5 text-muted-foreground">{c.email}</td>
                                            <td className="py-2.5 text-muted-foreground">
                                                {new Date(c.createdAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

            </div>
        </div>
    )
}
