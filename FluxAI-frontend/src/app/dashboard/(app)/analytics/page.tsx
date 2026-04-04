"use client"

import { PageContainer } from "@/components/dashboard/page-container"
import { useQuery } from "@tanstack/react-query"
import { analyticsApi, KPIData, AnalyticsFunnelResponse, AnalyticsTimeToHireResponse, AtsEfficiencyResponse } from "@/lib/api/analytics"
import { dashboardApi, ATSAnalytics } from "@/lib/api/dashboard"
import { Badge } from "@/components/ui/badge"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { Skeleton } from "@/components/dashboard/skeleton"
import {
    BarChart3, TrendingUp, TrendingDown, Minus, Users, Briefcase,
    FileText, Clock, Zap, Brain, Lightbulb, ArrowRight, ChevronRight,
    Target, Award,
} from "lucide-react"
import { useState, useMemo } from "react"

// ── Helpers ──────────────────────────────────────────────
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

function KPICard({ label, value, trend, trendDirection, icon: Icon }: KPIData & { icon: typeof Users }) {
    return (
        <div className="p-4 border border-line rounded-lg bg-card/50 hover:bg-card/80 transition-colors">
            <div className="flex items-center justify-between">
                <Icon className="w-5 h-5 text-muted-foreground" />
                <TrendBadge trend={trend} direction={trendDirection} />
            </div>
            <p className="text-2xl font-bold mt-3">{typeof value === 'number' ? value.toLocaleString() : value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
        </div>
    )
}

function FunnelBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
    const pct = max > 0 ? (value / max) * 100 : 0
    return (
        <div className="flex items-center gap-3">
            <span className="text-xs font-medium w-24 shrink-0 text-right text-muted-foreground">{label}</span>
            <div className="flex-1 h-7 bg-muted/30 rounded-md overflow-hidden relative">
                <div className={`h-full rounded-md transition-all duration-700 ease-out ${color}`} style={{ width: `${pct}%` }} />
                <span className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold">{value}</span>
            </div>
            <span className="text-[10px] text-muted-foreground w-12">{pct.toFixed(0)}%</span>
        </div>
    )
}

// ── AI Insight Generator ─────────────────────────────────
function generateInsights(
    funnel: AnalyticsFunnelResponse | undefined,
    tth: AnalyticsTimeToHireResponse | undefined,
    ats: ATSAnalytics | undefined,
    efficiency: AtsEfficiencyResponse | undefined
): string[] {
    const insights: string[] = []

    if (funnel) {
        const { conversionRates: cr } = funnel
        if (cr.appliedToInterview < 30)
            insights.push(`⚠️ Only ${cr.appliedToInterview}% of applicants move to interview — consider refining screening criteria or lowering hard gates.`)
        if (cr.interviewToOffer < 20)
            insights.push(`📉 Interview-to-offer conversion is ${cr.interviewToOffer}%. Investigate if interview difficulty is calibrated correctly.`)
        if (cr.offerToHired > 80)
            insights.push(`✅ ${cr.offerToHired}% offer acceptance rate — your compensation and employer brand are strong.`)
        if (cr.offerToHired < 50)
            insights.push(`🚨 Only ${cr.offerToHired}% of offers are accepted. Consider improving offer competitiveness or candidate experience.`)
    }

    if (tth) {
        if (tth.avgDays > 30)
            insights.push(`⏱ Average time-to-hire is ${tth.avgDays} days. Top companies target under 21 days. Check bottleneck stages.`)
        if (tth.avgDays <= 14)
            insights.push(`🚀 Excellent hiring speed — ${tth.avgDays} days average. You're outperforming industry benchmarks.`)
    }

    if (ats) {
        const topSource = ats.applicationSources?.[0]
        if (topSource)
            insights.push(`📊 Top candidate source: "${topSource.label}" (${topSource.percentage}% of applications). Double down on this channel.`)

        if (ats.avgTimeInStage) {
            const slowStage = Object.entries(ats.avgTimeInStage).sort(([, a], [, b]) => b - a)[0]
            if (slowStage && slowStage[1] > 5)
                insights.push(`🐢 "${slowStage[0]}" stage averages ${Math.round(slowStage[1])} days — this is your biggest bottleneck.`)
        }
    }

    if (efficiency) {
        if (efficiency.hoursSaved > 0)
            insights.push(`🤖 AI screening has saved approximately ${efficiency.hoursSaved} hours of manual review across ${efficiency.totalScreened} candidates.`)
    }

    if (insights.length === 0)
        insights.push('📈 Analytics are accumulating. More actionable insights will appear as your hiring data grows.')

    return insights
}

export default function AnalyticsPage() {
    const [jobFilter, setJobFilter] = useState<string | undefined>(undefined)

    const { data: kpiRes, isLoading: kpiLoading } = useQuery({
        queryKey: ['analytics-kpis', jobFilter],
        queryFn: () => analyticsApi.getKPIs(jobFilter),
    })
    const kpis = kpiRes?.data

    const { data: funnelRes, isLoading: funnelLoading } = useQuery({
        queryKey: ['analytics-funnel', jobFilter],
        queryFn: () => analyticsApi.getFunnel(jobFilter),
    })
    const funnel = funnelRes?.data

    const { data: tthRes } = useQuery({
        queryKey: ['analytics-tth', jobFilter],
        queryFn: () => analyticsApi.getTimeToHire(jobFilter),
    })
    const tth = tthRes?.data

    const { data: efficiencyRes } = useQuery({
        queryKey: ['analytics-efficiency', jobFilter],
        queryFn: () => analyticsApi.getAtsEfficiency(jobFilter),
    })
    const efficiency = efficiencyRes?.data

    const { data: atsRes } = useQuery({
        queryKey: ['dashboard-analytics'],
        queryFn: () => dashboardApi.analytics(),
    })
    const ats = atsRes?.data

    // Derived stats
    const funnelStages = funnel?.stageDistribution || {}
    const maxFunnel = Math.max(...Object.values(funnelStages), 1)
    const funnelColors = ['bg-sky-500', 'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500']

    const insights = useMemo(
        () => generateInsights(funnel, tth, ats, efficiency),
        [funnel, tth, ats, efficiency]
    )

    return (
        <PageContainer title="Analytics" description="Track hiring metrics, pipeline velocity, and AI-powered insights.">
            <div className="mt-6 w-full flex flex-col space-y-6">
                {/* ── KPI Cards ────────────────────────────────────── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {kpiLoading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="p-4 border border-line rounded-lg bg-card/50">
                                <Skeleton className="h-4 w-20 mb-3" />
                                <Skeleton className="h-8 w-16 mb-1" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                        ))
                    ) : kpis ? (
                        <>
                            <KPICard {...kpis.activeJobs} icon={Briefcase} />
                            <KPICard {...kpis.totalCandidates} icon={Users} />
                            <KPICard {...kpis.applications} icon={FileText} />
                            <KPICard {...kpis.awaitingReview} icon={Clock} />
                        </>
                    ) : null}
                </div>

                {/* ── Two-Column: Funnel + Insights ───────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Funnel */}
                    <div className="lg:col-span-3 border border-line rounded-lg bg-card/50 p-5">
                        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                            <Target className="w-4 h-4 text-accent" /> Hiring Funnel
                        </h3>
                        {funnelLoading ? (
                            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-7 w-full" />)}</div>
                        ) : Object.keys(funnelStages).length > 0 ? (
                            <div className="space-y-2.5">
                                {Object.entries(funnelStages).map(([stage, count], i) => (
                                    <FunnelBar key={stage} label={stage} value={count} max={maxFunnel} color={funnelColors[i % funnelColors.length]} />
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-8">No funnel data yet. Start processing candidates to see pipeline distribution.</p>
                        )}

                        {/* Conversion rates */}
                        {funnel?.conversionRates && (
                            <div className="flex items-center gap-4 mt-5 pt-4 border-t border-line/50">
                                <div className="text-center flex-1">
                                    <p className="text-lg font-bold text-accent">{funnel.conversionRates.appliedToInterview}%</p>
                                    <p className="text-[10px] text-muted-foreground">Applied → Interview</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
                                <div className="text-center flex-1">
                                    <p className="text-lg font-bold text-accent">{funnel.conversionRates.interviewToOffer}%</p>
                                    <p className="text-[10px] text-muted-foreground">Interview → Offer</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
                                <div className="text-center flex-1">
                                    <p className="text-lg font-bold text-accent">{funnel.conversionRates.offerToHired}%</p>
                                    <p className="text-[10px] text-muted-foreground">Offer → Hired</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* AI Insights */}
                    <div className="lg:col-span-2 border border-line rounded-lg bg-gradient-to-br from-card/80 to-accent/5 p-5">
                        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                            <Lightbulb className="w-4 h-4 text-amber-400" /> AI Insights
                        </h3>
                        <div className="space-y-3">
                            {insights.map((insight, i) => (
                                <div key={i} className="p-3 bg-card/80 border border-line/30 rounded-lg text-xs text-text-secondary leading-relaxed">
                                    {insight}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Time Metrics + Source Performance ────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Time to Hire */}
                    <div className="border border-line rounded-lg bg-card/50 p-5">
                        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-blue-400" /> Time to Hire
                        </h3>
                        {tth ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="text-center flex-1">
                                        <p className={`text-3xl font-bold ${tth.avgDays <= 21 ? 'text-emerald-400' : tth.avgDays <= 30 ? 'text-amber-400' : 'text-red-400'}`}>{tth.avgDays}</p>
                                        <p className="text-[10px] text-muted-foreground mt-1">Avg Days</p>
                                    </div>
                                    <div className="text-center flex-1 border-x border-line/30">
                                        <p className="text-xl font-semibold text-foreground">{tth.min}</p>
                                        <p className="text-[10px] text-muted-foreground mt-1">Fastest</p>
                                    </div>
                                    <div className="text-center flex-1">
                                        <p className="text-xl font-semibold text-foreground">{tth.max}</p>
                                        <p className="text-[10px] text-muted-foreground mt-1">Slowest</p>
                                    </div>
                                </div>

                                {/* Time per stage */}
                                {ats?.avgTimeInStage && Object.keys(ats.avgTimeInStage).length > 0 && (
                                    <div className="pt-3 border-t border-line/50">
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Time Per Stage (Days)</p>
                                        <div className="space-y-1.5">
                                            {Object.entries(ats.avgTimeInStage).map(([stage, days]) => (
                                                <div key={stage} className="flex items-center justify-between text-xs">
                                                    <span className="text-muted-foreground">{stage}</span>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
                                                            <div className={`h-full rounded-full ${days > 5 ? 'bg-red-500' : days > 3 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                                                style={{ width: `${Math.min(100, (days / 10) * 100)}%` }} />
                                                        </div>
                                                        <span className="font-medium w-8 text-right">{Math.round(days)}d</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-6">No hiring data available yet.</p>
                        )}
                    </div>

                    {/* Source Performance */}
                    <div className="border border-line rounded-lg bg-card/50 p-5">
                        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-purple-400" /> Source Performance
                        </h3>
                        {ats?.applicationSources && ats.applicationSources.length > 0 ? (
                            <div className="space-y-2.5">
                                {ats.applicationSources.map((src, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <span className="text-xs w-20 text-right text-muted-foreground truncate">{src.label}</span>
                                        <div className="flex-1 h-5 bg-muted/30 rounded-md overflow-hidden relative">
                                            <div className="h-full bg-purple-500/60 rounded-md transition-all" style={{ width: `${src.percentage}%` }} />
                                            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium">{src.value}</span>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground w-10">{src.percentage}%</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-6">No source data yet. Process candidates to see source performance.</p>
                        )}
                    </div>
                </div>

                {/* ── ATS Efficiency (AI Screening) ───────────────── */}
                {efficiency && (
                    <div className="border border-line rounded-lg bg-card/50 p-5">
                        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-amber-400" /> AI Screening Efficiency
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-muted/20 rounded-lg text-center">
                                <p className="text-2xl font-bold text-emerald-400">{efficiency.hoursSaved}h</p>
                                <p className="text-[10px] text-muted-foreground mt-1">Hours Saved</p>
                            </div>
                            <div className="p-4 bg-muted/20 rounded-lg text-center">
                                <p className="text-2xl font-bold">{efficiency.totalScreened}</p>
                                <p className="text-[10px] text-muted-foreground mt-1">Candidates Screened</p>
                            </div>
                            <div className="p-4 bg-muted/20 rounded-lg">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Score Distribution</p>
                                <div className="space-y-1">
                                    {efficiency.scoreDistribution.map((sd, i) => (
                                        <div key={i} className="flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground">{sd.range}</span>
                                            <span className="font-medium">{sd.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </PageContainer>
    )
}
