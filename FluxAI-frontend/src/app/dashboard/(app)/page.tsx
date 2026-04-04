"use client"

import { PageContainer } from "@/components/dashboard/page-container"
import { useQuery } from "@tanstack/react-query"
import { dashboardApi, DashboardSummary } from "@/lib/api/dashboard"
import { analyticsApi, KPIData } from "@/lib/api/analytics"
import { Skeleton } from "@/components/dashboard/skeleton"
import { EmptyState } from "@/components/dashboard/empty-state"
import Link from "next/link"
import {
    Home, Briefcase, Users, FileText, Clock, CheckCircle, Circle,
    ArrowRight, TrendingUp, TrendingDown, Minus, Sparkles,
    Plus, Search, Brain, BarChart3,
} from "lucide-react"
import { useState, useEffect, useMemo } from "react"

// ── Onboarding Checklist ─────────────────────────────────
interface OnboardingStep {
    id: string
    label: string
    description: string
    href: string
    checkFn: (data: DashboardSummary | null) => boolean
}

const ONBOARDING_STEPS: OnboardingStep[] = [
    { id: 'create-job', label: 'Create your first job', description: 'Post a job to start receiving applications', href: '/dashboard/jobs', checkFn: (d) => (d?.kpis?.activeJobs?.value ?? 0) > 0 },
    { id: 'add-candidate', label: 'Add your first candidate', description: 'Import or manually add a candidate to your ATS', href: '/dashboard/candidates', checkFn: (d) => (d?.kpis?.totalCandidates?.value ?? 0) > 0 },
    { id: 'pipeline', label: 'Move a candidate through the pipeline', description: 'Drag and drop candidates between stages', href: '/dashboard/ats', checkFn: (d) => (d?.kpis?.applications?.value ?? 0) > 0 },
    { id: 'interview', label: 'Run your first AI interview', description: 'Start an AI-powered interview evaluation', href: '/dashboard/interviews/ai', checkFn: () => false /* requires manual check */ },
]

function TrendBadge({ trend, direction }: { trend: number; direction: string }) {
    const isUp = direction === 'up'
    const isDown = direction === 'down'
    return (
        <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium ${isUp ? 'text-emerald-400' : isDown ? 'text-red-400' : 'text-muted-foreground'}`}>
            {isUp ? <TrendingUp className="w-3 h-3" /> : isDown ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
            {Math.abs(trend)}%
        </span>
    )
}

export default function DashboardHomePage() {
    const [dismissed, setDismissed] = useState(false)

    // Check localStorage for dismissed state
    useEffect(() => {
        const d = localStorage.getItem('fluxai-onboarding-dismissed')
        if (d === 'true') setDismissed(true)
    }, [])

    const { data: summaryRes, isLoading } = useQuery({
        queryKey: ['dashboard-summary'],
        queryFn: () => dashboardApi.summary(),
    })
    const summary = summaryRes?.data || null

    const completedSteps = useMemo(() => {
        return ONBOARDING_STEPS.filter(s => s.checkFn(summary)).length
    }, [summary])

    const allComplete = completedSteps >= ONBOARDING_STEPS.length - 1 // -1 for the interview step
    const showOnboarding = !dismissed && !allComplete

    const dismissOnboarding = () => {
        setDismissed(true)
        localStorage.setItem('fluxai-onboarding-dismissed', 'true')
    }

    const kpis = summary?.kpis
    const recentCandidates = summary?.recentCandidates || []

    return (
        <PageContainer title="Home" description="Welcome to Flexberry AI — your AI-native hiring command center.">
            <div className="mt-6 w-full flex flex-col space-y-6">
                {/* ── Onboarding Checklist ─────────────────────────── */}
                {showOnboarding && (
                    <div className="border border-accent/20 rounded-lg bg-gradient-to-br from-card/80 to-accent/5 p-5 animate-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-accent" />
                                <h3 className="font-semibold">Get Started</h3>
                                <span className="text-xs text-muted-foreground">({completedSteps}/{ONBOARDING_STEPS.length})</span>
                            </div>
                            <button onClick={dismissOnboarding} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Dismiss</button>
                        </div>
                        {/* Progress bar */}
                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-4">
                            <div className="h-full bg-accent rounded-full transition-all duration-500"
                                style={{ width: `${(completedSteps / ONBOARDING_STEPS.length) * 100}%` }} />
                        </div>
                        <div className="space-y-2.5">
                            {ONBOARDING_STEPS.map(step => {
                                const done = step.checkFn(summary)
                                return (
                                    <Link key={step.id} href={step.href}
                                        className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${done ? 'bg-emerald-500/5 border border-emerald-500/10' : 'bg-card/50 border border-line hover:bg-card/80'}`}>
                                        {done
                                            ? <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                                            : <Circle className="w-5 h-5 text-muted-foreground/40 shrink-0" />
                                        }
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-medium ${done ? 'text-emerald-400 line-through' : ''}`}>{step.label}</p>
                                            <p className="text-[10px] text-muted-foreground mt-0.5">{step.description}</p>
                                        </div>
                                        {!done && <ArrowRight className="w-4 h-4 text-muted-foreground/30 shrink-0" />}
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* ── KPI Cards ────────────────────────────────────── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {isLoading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="p-4 border border-line rounded-lg bg-card/50">
                                <Skeleton className="h-4 w-12 mb-3" />
                                <Skeleton className="h-8 w-16 mb-1" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                        ))
                    ) : kpis ? (
                        <>
                            {[
                                { data: kpis.activeJobs, icon: Briefcase },
                                { data: kpis.totalCandidates, icon: Users },
                                { data: kpis.applications, icon: FileText },
                                { data: kpis.awaitingReview, icon: Clock },
                            ].map(({ data, icon: Icon }) => (
                                <div key={data.label} className="p-4 border border-line rounded-lg bg-card/50 hover:bg-card/80 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <Icon className="w-5 h-5 text-muted-foreground" />
                                        <TrendBadge trend={data.trend} direction={data.trendDirection} />
                                    </div>
                                    <p className="text-2xl font-bold mt-3">{data.value}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{data.label}</p>
                                </div>
                            ))}
                        </>
                    ) : null}
                </div>

                {/* ── Quick Actions ────────────────────────────────── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        { label: 'New Job', icon: Plus, href: '/dashboard/jobs', color: 'text-blue-400' },
                        { label: 'Find Talent', icon: Search, href: '/dashboard/talent-prospect/search', color: 'text-purple-400' },
                        { label: 'AI Interview', icon: Brain, href: '/dashboard/interviews/ai', color: 'text-accent' },
                        { label: 'Analytics', icon: BarChart3, href: '/dashboard/analytics', color: 'text-emerald-400' },
                    ].map(action => (
                        <Link key={action.label} href={action.href}
                            className="flex items-center gap-2.5 p-3 border border-line rounded-lg bg-card/50 hover:bg-card/80 transition-colors group">
                            <action.icon className={`w-4 h-4 ${action.color}`} />
                            <span className="text-sm font-medium">{action.label}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/30 ml-auto group-hover:text-foreground transition-colors" />
                        </Link>
                    ))}
                </div>

                {/* ── Recent Candidates ───────────────────────────── */}
                <div className="border border-line rounded-lg bg-card/50 p-5">
                    <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" /> Recent Candidates
                    </h3>
                    {isLoading ? (
                        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
                    ) : recentCandidates.length > 0 ? (
                        <div className="divide-y divide-line/50">
                            {recentCandidates.slice(0, 5).map(c => (
                                <div key={c._id} className="flex items-center justify-between py-2.5">
                                    <div>
                                        <p className="text-sm font-medium">{c.firstName ? `${c.firstName} ${c.lastName}` : c.email}</p>
                                        <p className="text-[10px] text-muted-foreground">{c.source || 'Direct'} · {new Date(c.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <Link href="/dashboard/candidates" className="text-xs text-accent hover:underline">View</Link>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No candidates yet. Start by adding candidates or posting a job.</p>
                    )}
                </div>
            </div>
        </PageContainer>
    )
}
