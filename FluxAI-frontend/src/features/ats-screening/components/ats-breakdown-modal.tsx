"use client"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { AtsScoreBreakdownData, SkillMatchDetail, copilotApi, CandidateCopilotSummary } from "@/lib/api/ats-screening"
import { CheckCircle, AlertTriangle, Brain, Shield, Info, Sparkles, MessageSquare, Loader2 } from "lucide-react"
import * as React from "react"

interface AtsBreakdownModalProps {
    isOpen:              boolean
    onOpenChange:        (open: boolean) => void
    data:                AtsScoreBreakdownData | null
    isLoading:           boolean
    // New: Copilot summary props (optional — gracefully degraded if missing)
    jobId?:              string
    candidateId?:        string | null
    onGenerateQuestions?:(candidateId: string, name: string) => void
}

// ─────────────────────────────────────────────
// Skill Match Color Helpers
// ─────────────────────────────────────────────

const getStrengthStyle = (strength: string) => {
    switch (strength) {
        case 'strong':
            return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
        case 'partial':
            return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
        case 'none':
            return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"
        default:
            return "bg-muted text-muted-foreground"
    }
}

const getStrengthLabel = (strength: string) => {
    switch (strength) {
        case 'strong': return '✓ Match'
        case 'partial': return '~ Partial'
        case 'none': return '✗ Missing'
        default: return '?'
    }
}

// ─────────────────────────────────────────────
// Confidence Bar Component
// ─────────────────────────────────────────────

function ConfidenceBar({ value }: { value: number }) {
    const color = value >= 80 ? "bg-emerald-500" : value >= 50 ? "bg-amber-500" : "bg-red-500"

    return (
        <div className="group relative">
            <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-muted-foreground">Confidence</span>
                        <span className="text-xs font-semibold">{value}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${color}`}
                            style={{ width: `${value}%` }}
                        />
                    </div>
                </div>
            </div>
            {/* Tooltip on hover */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-popover border border-border rounded text-[10px] text-muted-foreground shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                Based on data completeness and scoring consistency
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────
// Copilot Summary (lazy-loaded)
// ─────────────────────────────────────────────

const CLASSIFICATION_STYLE = {
    strong:         'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    high_potential: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    borderline:     'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    at_risk:        'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
} as const

const CLASSIFICATION_LABEL = {
    strong: 'Strong Match', high_potential: 'High Potential',
    borderline: 'Borderline', at_risk: 'At Risk',
} as const

function CopilotSummarySection({
    jobId,
    candidateId,
    onGenerateQuestions,
}: {
    jobId: string
    candidateId: string
    onGenerateQuestions?: (id: string, name: string) => void
}) {
    const [summary,  setSummary]  = React.useState<CandidateCopilotSummary | null>(null)
    const [loading,  setLoading]  = React.useState(true)
    const [error,    setError]    = React.useState(false)

    React.useEffect(() => {
        setLoading(true)
        setError(false)
        setSummary(null)
        copilotApi.getCandidateSummary(jobId, candidateId)
            .then(res => {
                if (res.success && res.data) {
                    const s = (res.data as any).data ?? res.data
                    setSummary(s as CandidateCopilotSummary)
                } else {
                    setError(true)
                }
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false))
    }, [jobId, candidateId])

    if (loading) {
        return (
            <div className="flex items-center gap-2 p-3 border border-primary/15 bg-primary/5 text-xs text-muted-foreground animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                Copilot analysing...
            </div>
        )
    }

    if (error || !summary) return null

    const classStyle = CLASSIFICATION_STYLE[summary.classification]
    const classLabel = CLASSIFICATION_LABEL[summary.classification]

    return (
        <div className="border border-primary/20 bg-gradient-to-b from-primary/[0.04] to-transparent p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider">Copilot Analysis</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-sm border font-medium ${classStyle}`}>
                        {classLabel}
                    </span>
                    {onGenerateQuestions && (
                        <button
                            type="button"
                            onClick={() => onGenerateQuestions(candidateId, '')}
                            className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <MessageSquare className="w-3 h-3" />
                            Questions
                        </button>
                    )}
                </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">{summary.summary}</p>

            {summary.riskFlags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {summary.riskFlags.slice(0, 2).map((flag, i) => (
                        <span key={i} className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-sm">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            {flag}
                        </span>
                    ))}
                </div>
            )}
        </div>
    )
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────

export function AtsBreakdownModal({ isOpen, onOpenChange, data, isLoading, jobId, candidateId, onGenerateQuestions }: AtsBreakdownModalProps) {
    if (!data && !isLoading) return null

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        Scoring Breakdown
                        {data && (
                            <Badge variant="outline" className="ml-auto text-xs">
                                v{data.scoringVersion}
                            </Badge>
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        Detailed AI analysis of candidate compatibility.
                    </DialogDescription>
                </DialogHeader>

                {/* Copilot Summary — lazy loaded, shown before breakdown */}
                {jobId && candidateId && (
                    <CopilotSummarySection
                        jobId={jobId}
                        candidateId={candidateId}
                        onGenerateQuestions={onGenerateQuestions}
                    />
                )}

                {isLoading ? (
                    <div className="py-24 text-center text-muted-foreground animate-pulse">Loading breakdown...</div>
                ) : data ? (
                    <div className="space-y-6 pt-2">

                        {/* ── Row 1: Score + Radar ────────────────────── */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Radar Chart */}
                            <div className="h-[280px] bg-slate-50/50 dark:bg-slate-900/50 rounded-lg p-4 border border-border">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data.radarData}>
                                        <PolarGrid opacity={0.5} />
                                        <PolarAngleAxis
                                            dataKey="subject"
                                            tick={{ fill: 'currentColor', fontSize: 11 }}
                                            className="text-muted-foreground"
                                        />
                                        <PolarRadiusAxis angle={30} domain={[0, 100]} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                                        />
                                        <Radar
                                            name="Score"
                                            dataKey="A"
                                            stroke="hsl(var(--primary))"
                                            fill="hsl(var(--primary))"
                                            fillOpacity={0.4}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Score + Confidence + Metrics */}
                            <div className="space-y-5">
                                <div>
                                    <h4 className="text-sm font-semibold text-foreground mb-1 flex items-center justify-between">
                                        Final Score
                                        <span className="text-[10px] font-normal text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full border border-border">AI-Assessed</span>
                                    </h4>
                                    <div className="text-4xl tracking-tight mb-1">
                                        <span className={data.finalScore >= 80 ? "text-green-600" : data.finalScore >= 60 ? "text-yellow-600" : "text-red-600"}>
                                            {data.finalScore}
                                        </span>
                                        <span className="text-muted-foreground text-xl"> / 100</span>
                                    </div>
                                </div>

                                {/* Confidence Bar */}
                                <ConfidenceBar value={data.confidenceScore || 0} />

                                {/* Override Badge */}
                                {data.manualOverride && (
                                    <div className="flex items-center gap-2 p-2 bg-purple-500/10 border border-purple-500/20 rounded-md">
                                        <Badge className="bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-500/30 text-xs">
                                            ★ Manually Overridden
                                        </Badge>
                                        {data.manualOverride.reason && (
                                            <span className="text-xs text-muted-foreground truncate">
                                                — {data.manualOverride.reason}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Hard Gate Failure */}
                                {data.status === 'FAILED_GATE' && data.hardGateFailureReason && (
                                    <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-md">
                                        <h5 className="text-sm font-semibold tracking-tight text-red-800 dark:text-red-400 mb-1">Hard Gate Failed</h5>
                                        <p className="text-sm text-red-700 dark:text-red-300">
                                            {data.hardGateFailureReason}
                                        </p>
                                    </div>
                                )}

                                {/* Metrics Summary */}
                                <div>
                                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5 text-foreground">
                                        Score Breakdown
                                    </h4>
                                    <ul className="text-sm space-y-2">
                                        {data.radarData.map(item => {
                                            const hints: Record<string, string> = {
                                                'Skills': 'Technical and domain skill alignment',
                                                'Experience': 'Relevance of past roles and tenure',
                                                'Projects': 'Portfolio and project complexity',
                                                'Education': 'Academic background match',
                                                'Signal Boost': 'Elite companies or achievements',
                                                'Bonus': 'Extra qualifications'
                                            }
                                            return (
                                                <li key={item.subject} className="flex justify-between border-b border-border/40 pb-1.5 last:border-0">
                                                    <div>
                                                        <span className="text-foreground cursor-help underline decoration-muted-foreground/30 decoration-dotted underline-offset-2" title={hints[item.subject]}>
                                                            {item.subject}
                                                        </span>
                                                        <p className="text-[10px] text-muted-foreground mt-0.5">{hints[item.subject]}</p>
                                                    </div>
                                                    <span className="font-semibold text-foreground">{item.A}%</span>
                                                </li>
                                            )
                                        })}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* ── Row 2: Explanation (Part 2) ──────────────── */}
                        {data.explanation && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Strengths */}
                                {data.explanation.strengths.length > 0 && (
                                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/15 rounded-lg">
                                        <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-3 text-emerald-700 dark:text-emerald-400">
                                            <CheckCircle className="h-4 w-4" />
                                            Strengths
                                        </h4>
                                        <ul className="space-y-2">
                                            {data.explanation.strengths.map((s, i) => (
                                                <li key={i} className="text-sm text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                                                    <span className="text-emerald-500 mt-0.5">•</span>
                                                    {s}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Weaknesses */}
                                {data.explanation.weaknesses.length > 0 && (
                                    <div className="p-4 bg-amber-500/5 border border-amber-500/15 rounded-lg">
                                        <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-3 text-amber-700 dark:text-amber-400">
                                            <AlertTriangle className="h-4 w-4" />
                                            Areas of Concern
                                        </h4>
                                        <ul className="space-y-2">
                                            {data.explanation.weaknesses.map((w, i) => (
                                                <li key={i} className="text-sm text-amber-800 dark:text-amber-300 flex items-start gap-2">
                                                    <span className="text-amber-500 mt-0.5">•</span>
                                                    {w}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Summary */}
                        {data.explanation?.summary && (
                            <div className="p-4 bg-slate-500/5 border border-slate-500/15 rounded-lg">
                                <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-2 text-foreground">
                                    <Brain className="h-4 w-4 text-muted-foreground" />
                                    AI Assessment
                                </h4>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {data.explanation.summary}
                                </p>
                            </div>
                        )}

                        {/* ── Row 2.5: V2 AI Insights ────────────────── */}
                        {data.insights && data.insights.length > 0 && (
                            <div className="p-4 bg-blue-500/5 border border-blue-500/15 rounded-lg">
                                <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-3 text-blue-700 dark:text-blue-400">
                                    <Brain className="h-4 w-4" />
                                    Semantic Analysis Insights
                                </h4>
                                <ul className="space-y-2">
                                    {data.insights.map((insight, i) => (
                                        <li key={i} className="text-sm text-blue-800 dark:text-blue-300 flex items-start gap-2">
                                            <span className="text-blue-500 mt-0.5">→</span>
                                            {insight}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* ── Row 3: Skill Match Details (V2) ──────────── */}
                        {data.skillMatchDetails && data.skillMatchDetails.length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                                    Skill Match Analysis
                                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {data.skillMatchDetails.map((detail: SkillMatchDetail, i: number) => (
                                        <div
                                            key={i}
                                            className={`group relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium ${getStrengthStyle(detail.strength)}`}
                                        >
                                            <span className="font-semibold">{detail.skill}</span>
                                            <span className="opacity-70">{getStrengthLabel(detail.strength)}</span>

                                            {/* Tooltip */}
                                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-popover border border-border rounded text-[10px] text-muted-foreground shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                                {detail.strength === 'none'
                                                    ? 'No matching skill found'
                                                    : `Best: ${detail.bestMatch} (${Math.round(detail.similarity * 100)}%)`
                                                }
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                ) : null}

            </DialogContent>
        </Dialog>
    )
}
