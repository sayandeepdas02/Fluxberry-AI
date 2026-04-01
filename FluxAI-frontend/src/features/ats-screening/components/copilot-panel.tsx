"use client"

import * as React from "react"
import {
    Sparkles, Trophy, Lightbulb, Zap,
    AlertTriangle, CheckCircle2, ChevronRight,
    Brain, MessageSquare, Loader2, RefreshCw, User
} from "lucide-react"
import { copilotApi, CopilotOutput, CopilotRecommendation } from "@/lib/api/ats-screening"

// ──────────────────────────────────────────────────────────────
// Classification helpers
// ──────────────────────────────────────────────────────────────

const CLASSIFICATION_CONFIG = {
    strong:         { label: "Strong Match",    color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20", dot: "bg-emerald-500" },
    high_potential: { label: "High Potential",  color: "text-blue-500",    bg: "bg-blue-500/10 border-blue-500/20",       dot: "bg-blue-500"    },
    borderline:     { label: "Borderline",      color: "text-amber-500",   bg: "bg-amber-500/10 border-amber-500/20",     dot: "bg-amber-500"   },
    at_risk:        { label: "At Risk",         color: "text-red-500",     bg: "bg-red-500/10 border-red-500/20",         dot: "bg-red-500"     },
} as const

// ──────────────────────────────────────────────────────────────
// Recommendation Card
// ──────────────────────────────────────────────────────────────

function RecommendationCard({
    rec,
    rank,
    onView,
    onGenerateQuestions,
}: {
    rec: CopilotRecommendation
    rank: number
    onView: (id: string) => void
    onGenerateQuestions: (id: string, name: string) => void
}) {
    const cfg = CLASSIFICATION_CONFIG[rec.classification]

    return (
        <div className="relative group flex flex-col gap-3 p-4 border border-border bg-card hover:border-primary/30 transition-all duration-200">
            {/* Rank badge */}
            <div className="absolute -top-2.5 -left-2.5 w-6 h-6 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center shadow-sm">
                {rank}
            </div>

            {/* Header row */}
            <div className="flex items-start justify-between gap-3 pl-2">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-muted/60 border border-border flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{rec.name}</p>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-sm border ${cfg.bg} ${cfg.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                            {cfg.label}
                        </span>
                    </div>
                </div>

                {/* Score badges */}
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <div className="flex items-center gap-1">
                        <span className="text-lg text-foreground leading-none">{rec.score}</span>
                        <span className="text-xs text-muted-foreground">/100</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full ${rec.confidence >= 70 ? 'bg-emerald-500' : rec.confidence >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                style={{ width: `${rec.confidence}%` }}
                            />
                        </div>
                        <span className="text-[10px] text-muted-foreground">{rec.confidence}%</span>
                    </div>
                </div>
            </div>

            {/* Reason */}
            <p className="text-xs text-muted-foreground leading-relaxed pl-2">{rec.reason}</p>

            {/* Risk flags (or top weakness if no flags) */}
            {rec.riskFlags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pl-2">
                    {rec.riskFlags.slice(0, 2).map((flag, i) => (
                        <span key={i} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-sm">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            {flag}
                        </span>
                    ))}
                </div>
            ) : rec.weaknesses?.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pl-2">
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-muted/60 text-muted-foreground border border-border rounded-sm">
                        <AlertTriangle className="w-2.5 h-2.5 opacity-50" />
                        {rec.weaknesses[0]}
                    </span>
                </div>
            ) : null}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1 pl-2 border-t border-border">
                <button
                    type="button"
                    onClick={() => onView(rec.candidateId)}
                    className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors font-medium"
                >
                    View breakdown
                    <ChevronRight className="w-3 h-3" />
                </button>
                <div className="w-px h-3 bg-border" />
                <button
                    type="button"
                    onClick={() => onGenerateQuestions(rec.candidateId, rec.name)}
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                    <MessageSquare className="w-3 h-3" />
                    Generate questions
                </button>
            </div>
        </div>
    )
}

// ──────────────────────────────────────────────────────────────
// Skeleton
// ──────────────────────────────────────────────────────────────

function CopilotSkeleton() {
    return (
        <div className="space-y-4 animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-44 border border-border bg-card rounded-sm" />
                ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-28 border border-border bg-card rounded-sm" />
                <div className="h-28 border border-border bg-card rounded-sm" />
            </div>
        </div>
    )
}

// ──────────────────────────────────────────────────────────────
// Main Panel
// ──────────────────────────────────────────────────────────────

interface CopilotPanelProps {
    jobId:               string
    onViewCandidate:     (id: string) => void
    onGenerateQuestions: (candidateId: string, name: string) => void
}

export function CopilotPanel({ jobId, onViewCandidate, onGenerateQuestions }: CopilotPanelProps) {
    const [data,          setData]        = React.useState<CopilotOutput | null>(null)
    const [loading,       setLoading]     = React.useState(true)
    const [error,         setError]       = React.useState<string | null>(null)
    const [lastRefreshed, setLastRefreshed] = React.useState<Date | null>(null)
    const [refreshing,    setRefreshing]  = React.useState(false)
    const [collapsed,     setCollapsed]   = React.useState(false)

    const load = React.useCallback(async (showRefreshing = false) => {
        if (showRefreshing) setRefreshing(true)
        else setLoading(true)
        setError(null)
        try {
            const res = await copilotApi.getInsights(jobId)
            if (res.success && res.data) {
                // Backend returns { success, data: CopilotOutput }
                const output = (res.data as any).data ?? res.data
                setData(output as CopilotOutput)
                setLastRefreshed(new Date())
            } else {
                setError('Unable to generate insights')
            }
        } catch {
            setError('Failed to load Copilot insights')
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [jobId])

    React.useEffect(() => {
        load()
        // Auto-refresh every 5 minutes
        const interval = setInterval(() => load(true), 5 * 60 * 1000)
        return () => clearInterval(interval)
    }, [load])

    return (
        <div className="border border-primary/20 bg-gradient-to-b from-primary/[0.03] to-transparent rounded-none overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-primary/15">
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div>
                        <span className="text-sm font-semibold text-foreground">AI Hiring Copilot</span>
                        {data && (
                            <span className="ml-2 text-[10px] text-muted-foreground">
                                {data.scoredCount} scored · {data.candidateCount} total
                            </span>
                        )}
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-sm font-medium uppercase tracking-wider">
                        Beta
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    {lastRefreshed && (
                        <span className="text-[10px] text-muted-foreground/60 hidden sm:block">
                            Updated {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    )}
                    <button
                        type="button"
                        onClick={() => load(true)}
                        disabled={refreshing || loading}
                        className="p-1.5 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
                        title="Refresh"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        type="button"
                        onClick={() => setCollapsed(c => !c)}
                        className="p-1.5 text-muted-foreground hover:text-foreground transition-colors text-xs"
                    >
                        {collapsed ? 'Expand' : 'Collapse'}
                    </button>
                </div>
            </div>

            {!collapsed && (
                <div className="p-5 space-y-5">
                    {loading ? (
                        <CopilotSkeleton />
                    ) : error ? (
                        <div className="text-center py-8 text-sm text-muted-foreground border border-border border-dashed">
                            <Brain className="w-8 h-8 mx-auto mb-3 opacity-20" />
                            {error}
                            <button
                                type="button"
                                onClick={() => load()}
                                className="block mx-auto mt-2 text-xs text-primary hover:underline"
                            >
                                Retry
                            </button>
                        </div>
                    ) : !data || data.scoredCount === 0 ? (
                        <div className="text-center py-8 text-sm text-muted-foreground border border-border border-dashed">
                            <Sparkles className="w-8 h-8 mx-auto mb-3 opacity-20" />
                            <p className="font-medium text-foreground mb-1">No scored candidates yet</p>
                            <p className="text-xs">Copilot will surface recommendations once candidates are screened.</p>
                        </div>
                    ) : (
                        <>
                            {/* Section 1: Top Recommendations */}
                            {data.topRecommendations.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Trophy className="w-3.5 h-3.5 text-amber-500" />
                                        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                                            Top Recommendations
                                        </h3>
                                        <span className="text-[10px] text-muted-foreground">
                                            · {data.topRecommendations.length} candidate{data.topRecommendations.length !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                        {data.topRecommendations.map((rec, i) => (
                                            <RecommendationCard
                                                key={rec.candidateId}
                                                rec={rec}
                                                rank={i + 1}
                                                onView={onViewCandidate}
                                                onGenerateQuestions={onGenerateQuestions}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Section 2 + 3: Insights + Actions */}
                            {(data.insights.length > 0 || data.suggestedActions.length > 0) && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Pool Insights */}
                                    {data.insights.length > 0 && (
                                        <div className="border border-border bg-card p-4">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Lightbulb className="w-3.5 h-3.5 text-blue-500" />
                                                <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                                                    Copilot Insights
                                                </h3>
                                            </div>
                                            <ul className="space-y-2">
                                                {data.insights.map((insight, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                                                        <span className="text-blue-500 mt-0.5 flex-shrink-0">→</span>
                                                        {insight}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Suggested Actions */}
                                    {data.suggestedActions.length > 0 && (
                                        <div className="border border-border bg-card p-4">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Zap className="w-3.5 h-3.5 text-emerald-500" />
                                                <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                                                    Suggested Actions
                                                </h3>
                                            </div>
                                            <ul className="space-y-2">
                                                {data.suggestedActions.map((action, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                                                        <CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                                                        {action}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    )
}
