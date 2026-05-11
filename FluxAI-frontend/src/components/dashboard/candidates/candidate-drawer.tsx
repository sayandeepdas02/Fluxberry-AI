"use client"

import { useCandidatesStore } from '@/lib/store/candidates-store'
import { useQuery } from '@tanstack/react-query'
import { candidatesApi, ScreeningData } from '@/lib/api/candidates'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Mail, Phone, ExternalLink, Sparkles, Briefcase, TrendingUp, TrendingDown, Brain, Shield, AlertTriangle, CalendarPlus, X, Copy, Check, Zap } from 'lucide-react'
import { CandidateTimeline } from './candidate-timeline'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { format } from 'date-fns'
import { useState } from 'react'
import { useApiMutation } from '@/lib/hooks/use-api-mutation'
import { interviewsApi, CreateInterviewInput } from '@/lib/api/interviews'
import { aiApi, OutreachDraft, SkillGapAnalysis } from '@/lib/api/ai-intelligence'

// ── AI Summary from real screening data ─────────
function deriveAISummary(screening: ScreeningData) {
    const score = screening.finalScore ?? 0
    const breakdown = screening.scoreBreakdown

    // Derive fit level
    let overallFit: string
    if (score >= 80) overallFit = 'Strong'
    else if (score >= 60) overallFit = 'Good'
    else if (score >= 40) overallFit = 'Moderate'
    else overallFit = 'Weak'

    // Build strengths from high-scoring dimensions
    const strengths: string[] = []
    const concerns: string[] = []

    if (breakdown) {
        const dimensions = [
            { name: 'Technical Skills', score: breakdown.skillScore, weight: 0.35 },
            { name: 'Experience', score: breakdown.experienceScore, weight: 0.30 },
            { name: 'Projects', score: breakdown.projectScore, weight: 0.20 },
            { name: 'Education', score: breakdown.educationScore, weight: 0.10 },
        ]

        dimensions.forEach(d => {
            if (d.score >= 70) strengths.push(`Strong ${d.name.toLowerCase()} match (${Math.round(d.score)}%)`)
            else if (d.score <= 30) concerns.push(`${d.name} score is below threshold (${Math.round(d.score)}%)`)
        })

        if (breakdown.signalBoostScore && breakdown.signalBoostScore > 0) {
            strengths.push(`Signal boost detected (+${Math.round(breakdown.signalBoostScore)}%)`)
        }
    }

    // Add insights from the screening engine
    if (screening.insights?.length) {
        screening.insights.forEach(insight => {
            if (!strengths.includes(insight) && !concerns.includes(insight)) {
                strengths.push(insight)
            }
        })
    }

    // Add skill match details
    if (screening.skillMatchDetails?.length) {
        const strongMatches = screening.skillMatchDetails.filter(s => s.similarity >= 0.7)
        const weakMatches = screening.skillMatchDetails.filter(s => s.similarity < 0.4)

        if (strongMatches.length > 0) {
            strengths.push(`${strongMatches.length} skills with strong match: ${strongMatches.slice(0, 3).map(s => s.skill).join(', ')}`)
        }
        if (weakMatches.length > 0) {
            concerns.push(`${weakMatches.length} skills with weak match: ${weakMatches.slice(0, 3).map(s => s.skill).join(', ')}`)
        }
    }

    if (screening.hardGateFailureReason) {
        concerns.push(`Hard gate failed: ${screening.hardGateFailureReason}`)
    }

    // Generate recommendation
    let recommendation: string
    if (score >= 80) {
        recommendation = 'Strong candidate — scores indicate an excellent match. Recommend fast-tracking to interview.'
    } else if (score >= 60) {
        recommendation = 'Good potential — meets most criteria. Consider additional screening or interview to clarify areas of concern.'
    } else if (score >= 40) {
        recommendation = 'Moderate match — gaps in key areas. Review concerns carefully before deciding next steps.'
    } else {
        recommendation = 'Below threshold — significant gaps detected. Consider other candidates unless specific strengths stand out.'
    }

    // Ensure we always have at least one item in each list
    if (strengths.length === 0) strengths.push('No standout strengths identified from available data')
    if (concerns.length === 0) concerns.push('No significant concerns identified')

    return { overallFit, fitScore: Math.round(score), strengths, concerns, recommendation }
}

// ── AI Insights Tab ──────────────────────────────
function AiInsightsTab({ candidateId, jobId }: { candidateId: string; jobId?: string }) {
    const [outreachDraft, setOutreachDraft] = useState<OutreachDraft | null>(null)
    const [skillGap, setSkillGap] = useState<SkillGapAnalysis | null>(null)
    const [copied, setCopied] = useState(false)

    const { data: insightsRes, isLoading: loadingInsights } = useQuery({
        queryKey: ['ai-candidate-insights', candidateId, jobId],
        queryFn: () => aiApi.getCandidateInsights(candidateId, jobId),
    })
    const insights = insightsRes?.data as any

    const outreachMutation = useApiMutation({
        mutationFn: () => aiApi.generateOutreachDraft(candidateId, jobId!),
        onSuccess: (data) => setOutreachDraft((data?.data as any) || null),
    })

    const skillGapMutation = useApiMutation({
        mutationFn: () => aiApi.getSkillGap(candidateId, jobId!),
        onSuccess: (data) => setSkillGap((data?.data as any) || null),
    })

    function copyToClipboard(text: string) {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        })
    }

    if (loadingInsights) {
        return (
            <div className="flex h-48 items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-5">
            {/* Fit summary */}
            {insights ? (
                <>
                    {/* Fit score pill */}
                    {insights.fitLabel && (
                        <div className="flex items-center justify-between p-4 bg-card/60 border border-line rounded-lg">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">AI Assessment</p>
                                <p className="text-sm font-semibold text-foreground mt-1 leading-snug max-w-[260px]">
                                    {insights.summary || 'No summary available.'}
                                </p>
                            </div>
                            <div className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                                insights.fitLabel === 'strong' ? 'bg-emerald-500/10 text-emerald-400'
                                : insights.fitLabel === 'good' ? 'bg-blue-500/10 text-blue-400'
                                : insights.fitLabel === 'potential' ? 'bg-amber-500/10 text-amber-400'
                                : 'bg-red-500/10 text-red-400'
                            }`}>
                                {insights.fitLabel}
                            </div>
                        </div>
                    )}

                    {/* Strengths */}
                    {insights.strengths?.length > 0 && (
                        <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2 flex items-center gap-1.5">
                                <TrendingUp className="w-3.5 h-3.5" /> Strengths
                            </h4>
                            <ul className="space-y-1.5">
                                {insights.strengths.map((s: string, i: number) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                                        {s}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Gaps */}
                    {insights.gaps?.length > 0 && (
                        <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1.5">
                                <TrendingDown className="w-3.5 h-3.5" /> Gaps
                            </h4>
                            <ul className="space-y-1.5">
                                {insights.gaps.map((g: string, i: number) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                                        {g}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Red flags */}
                    {insights.redFlags?.length > 0 && (
                        <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-red-400 mb-2 flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5" /> Red Flags
                            </h4>
                            <ul className="space-y-1.5">
                                {insights.redFlags.map((r: string, i: number) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                                        {r}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Recommended action */}
                    {insights.recommendedAction && (
                        <div className="p-4 bg-accent/5 border border-accent/10 rounded-lg">
                            <h4 className="text-xs font-semibold text-accent mb-1.5 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5" /> Recommended Action
                            </h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">{insights.recommendedAction}</p>
                        </div>
                    )}
                </>
            ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Brain className="w-8 h-8 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">No AI insights available for this candidate yet.</p>
                </div>
            )}

            {/* Skill Gap Analysis */}
            {jobId && (
                <div className="border border-line rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 bg-card/40 border-b border-line">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Skill Gap Analysis</span>
                        {!skillGap && (
                            <button
                                onClick={() => skillGapMutation.mutate()}
                                disabled={skillGapMutation.isPending}
                                className="flex items-center gap-1.5 text-xs text-accent hover:opacity-80 transition-opacity disabled:opacity-40"
                            >
                                {skillGapMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                                Analyze
                            </button>
                        )}
                    </div>
                    {skillGap ? (
                        <div className="p-4 space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="flex-1 h-2 bg-muted/30 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-accent rounded-full transition-all duration-700"
                                        style={{ width: `${skillGap.matchPercentage}%` }}
                                    />
                                </div>
                                <span className="text-sm font-semibold tabular-nums">{skillGap.matchPercentage}%</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{skillGap.summary}</p>
                            <div className="flex flex-wrap gap-1.5">
                                {skillGap.presentSkills.map((s) => (
                                    <Badge key={s} className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">{s}</Badge>
                                ))}
                                {skillGap.missingSkills.map((s) => (
                                    <Badge key={s} className="text-[10px] bg-red-500/10 text-red-400 border-red-500/20">{s}</Badge>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="px-4 py-3 text-xs text-muted-foreground/60">
                            Click Analyze to compare candidate skills against the job requirements.
                        </div>
                    )}
                </div>
            )}

            {/* Outreach Draft */}
            {jobId && (
                <div className="border border-line rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 bg-card/40 border-b border-line">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Outreach Draft</span>
                        {!outreachDraft && (
                            <button
                                onClick={() => outreachMutation.mutate()}
                                disabled={outreachMutation.isPending}
                                className="flex items-center gap-1.5 text-xs text-accent hover:opacity-80 transition-opacity disabled:opacity-40"
                            >
                                {outreachMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                Generate
                            </button>
                        )}
                    </div>
                    {outreachDraft ? (
                        <div className="p-4 space-y-3">
                            <div>
                                <p className="text-[10px] text-muted-foreground mb-1">Subject</p>
                                <p className="text-xs font-medium">{outreachDraft.subject}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-muted-foreground mb-1">Body</p>
                                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{outreachDraft.body}</p>
                            </div>
                            <button
                                onClick={() => copyToClipboard(`Subject: ${outreachDraft.subject}\n\n${outreachDraft.body}`)}
                                className="flex items-center gap-1.5 text-xs text-accent hover:opacity-80 transition-opacity"
                            >
                                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                {copied ? 'Copied!' : 'Copy to clipboard'}
                            </button>
                        </div>
                    ) : (
                        <div className="px-4 py-3 text-xs text-muted-foreground/60">
                            Generate a personalized outreach email for this candidate.
                        </div>
                    )}
                </div>
            )}

            {!jobId && (
                <p className="text-xs text-muted-foreground/60 text-center italic">
                    Open from an application to enable Skill Gap Analysis and Outreach Draft generation.
                </p>
            )}
        </div>
    )
}

export function CandidateDrawer() {
    const { isDrawerOpen, setDrawerOpen, selectedCandidateId } = useCandidatesStore()
    const [schedulingAppId, setSchedulingAppId] = useState<string | null>(null)
    const [interviewForm, setInterviewForm] = useState({
        type: 'TECHNICAL' as CreateInterviewInput['type'],
        startTime: '',
        endTime: '',
        meetingLink: '',
    })

    const scheduleInterviewMutation = useApiMutation({
        mutationFn: (input: CreateInterviewInput) => interviewsApi.create(input),
        successMessage: 'Interview scheduled',
        invalidateKeys: [['interviews']],
        onSuccess: () => { setSchedulingAppId(null) },
    })

    const { data: response, isLoading } = useQuery({
        queryKey: ['candidate', selectedCandidateId],
        queryFn: () => candidatesApi.getById(selectedCandidateId!),
        enabled: !!selectedCandidateId,
    })

    const data = response?.data
    const candidateName = data ? `${data.candidate.firstName || ''} ${data.candidate.lastName || ''}`.trim() : ''
    const aiSummary = data?.screening ? deriveAISummary(data.screening) : null
    const applicationCount = data?.applications?.length || 0
    const hasScreening = !!data?.screening
    const firstJobId = data?.applications?.[0]
        ? (typeof data.applications[0].jobId === 'object' ? data.applications[0].jobId._id : data.applications[0].jobId)
        : undefined

    return (
        <Sheet open={isDrawerOpen} onOpenChange={setDrawerOpen}>
            <SheetContent className="w-full sm:max-w-xl bg-background border-l border-line p-0 flex flex-col h-full">
                {isLoading ? (
                    <div className="flex h-full items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                ) : data ? (
                    <>
                        {/* ── Header ─────────────────────────────────────── */}
                        <div className="p-6 border-b border-line flex flex-col gap-4">
                            <SheetHeader>
                                <SheetTitle className="text-xl font-semibold flex items-center justify-between mt-4">
                                    <span>{candidateName}</span>
                                    <div className="flex items-center gap-2">
                                        {applicationCount > 0 && (
                                            <Badge variant="secondary" className="gap-1">
                                                <Briefcase className="w-3 h-3" />
                                                {applicationCount} {applicationCount === 1 ? 'application' : 'applications'}
                                            </Badge>
                                        )}
                                        {data.candidate.source && (
                                            <Badge variant="outline" className="capitalize select-none">
                                                {data.candidate.source}
                                            </Badge>
                                        )}
                                    </div>
                                </SheetTitle>
                            </SheetHeader>

                            <div className="flex flex-col gap-2 text-sm text-muted-foreground mt-2">
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4" />
                                    <span>{data.candidate.email}</span>
                                </div>
                                {data.candidate.phone && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-4 h-4" />
                                        <span>{data.candidate.phone}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── Tab Content ─────────────────────────────────── */}
                        <div className="flex-1 overflow-hidden flex flex-col">
                            <Tabs defaultValue="ai-summary" className="w-full h-full flex flex-col">
                                <div className="px-6 border-b border-line">
                                    <TabsList className="bg-transparent border-none p-0 h-auto gap-4">
                                        <TabsTrigger
                                            value="ai-summary"
                                            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none px-0 py-3 text-muted-foreground data-[state=active]:text-foreground transition-none gap-1.5"
                                        >
                                            <Sparkles className="w-3.5 h-3.5" />
                                            AI Summary
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="timeline"
                                            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none px-0 py-3 text-muted-foreground data-[state=active]:text-foreground transition-none"
                                        >
                                            Timeline
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="applications"
                                            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none px-0 py-3 text-muted-foreground data-[state=active]:text-foreground transition-none"
                                        >
                                            Applications ({applicationCount})
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="resume"
                                            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none px-0 py-3 text-muted-foreground data-[state=active]:text-foreground transition-none"
                                        >
                                            Resume
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="ai-insights"
                                            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none px-0 py-3 text-muted-foreground data-[state=active]:text-foreground transition-none gap-1.5"
                                        >
                                            <Brain className="w-3.5 h-3.5" />
                                            AI Insights
                                        </TabsTrigger>
                                    </TabsList>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6">
                                    {/* ── AI Summary Tab ───────────────────────── */}
                                    <TabsContent value="ai-summary" className="mt-0 space-y-5">
                                        {aiSummary ? (
                                            <>
                                                {/* Fit Score */}
                                                <div className="flex items-center justify-between p-4 bg-card/60 border border-line rounded-lg">
                                                    <div>
                                                        <p className="text-xs text-muted-foreground uppercase tracking-wider">AI Fit Score</p>
                                                        <p className="text-2xl font-bold text-foreground mt-1">{aiSummary.fitScore}%</p>
                                                    </div>
                                                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                        aiSummary.fitScore >= 75
                                                            ? 'bg-emerald-500/10 text-emerald-400'
                                                            : aiSummary.fitScore >= 50
                                                                ? 'bg-amber-500/10 text-amber-400'
                                                                : 'bg-red-500/10 text-red-400'
                                                    }`}>
                                                        {aiSummary.overallFit} Fit
                                                    </div>
                                                </div>

                                                {/* Score Breakdown */}
                                                {data.screening?.scoreBreakdown && (
                                                    <div className="p-4 border border-line rounded-lg bg-card/40">
                                                        <h4 className="text-sm font-semibold flex items-center gap-1.5 text-foreground mb-3">
                                                            <Brain className="w-4 h-4 text-accent" />
                                                            Score Breakdown
                                                        </h4>
                                                        <div className="space-y-2">
                                                            {[
                                                                { label: 'Skills', value: data.screening.scoreBreakdown.skillScore },
                                                                { label: 'Experience', value: data.screening.scoreBreakdown.experienceScore },
                                                                { label: 'Projects', value: data.screening.scoreBreakdown.projectScore },
                                                                { label: 'Education', value: data.screening.scoreBreakdown.educationScore },
                                                            ].map(dim => (
                                                                <div key={dim.label} className="flex items-center gap-3">
                                                                    <span className="text-xs text-muted-foreground w-20">{dim.label}</span>
                                                                    <div className="flex-1 h-2 bg-muted/30 rounded-full overflow-hidden">
                                                                        <div
                                                                            className={`h-full rounded-full transition-all duration-500 ${
                                                                                dim.value >= 70 ? 'bg-emerald-500' : dim.value >= 40 ? 'bg-amber-500' : 'bg-red-500'
                                                                            }`}
                                                                            style={{ width: `${dim.value}%` }}
                                                                        />
                                                                    </div>
                                                                    <span className="text-xs font-medium w-8 text-right">{Math.round(dim.value)}%</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Manual Override badge */}
                                                {data.screening?.manualOverride && (
                                                    <div className="flex items-center gap-2 p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg">
                                                        <Shield className="w-4 h-4 text-blue-400" />
                                                        <span className="text-xs font-medium text-blue-400">
                                                            Manual override: {data.screening.manualOverride.decision}
                                                        </span>
                                                        {data.screening.manualOverride.reason && (
                                                            <span className="text-xs text-muted-foreground">— {data.screening.manualOverride.reason}</span>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Hard Gate Warning */}
                                                {data.screening?.hardGateFailureReason && (
                                                    <div className="flex items-center gap-2 p-3 bg-red-500/5 border border-red-500/10 rounded-lg">
                                                        <AlertTriangle className="w-4 h-4 text-red-400" />
                                                        <span className="text-xs font-medium text-red-400">
                                                            Hard gate failed: {data.screening.hardGateFailureReason}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Strengths */}
                                                <div>
                                                    <h4 className="text-sm font-semibold flex items-center gap-1.5 text-emerald-400 mb-3">
                                                        <TrendingUp className="w-4 h-4" />
                                                        Strengths
                                                    </h4>
                                                    <ul className="space-y-2">
                                                        {aiSummary.strengths.map((s, i) => (
                                                            <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                                                                {s}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>

                                                {/* Concerns */}
                                                <div>
                                                    <h4 className="text-sm font-semibold flex items-center gap-1.5 text-amber-400 mb-3">
                                                        <TrendingDown className="w-4 h-4" />
                                                        Areas of Concern
                                                    </h4>
                                                    <ul className="space-y-2">
                                                        {aiSummary.concerns.map((c, i) => (
                                                            <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                                                                {c}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>

                                                {/* Recommendation */}
                                                <div className="p-4 bg-accent/5 border border-accent/10 rounded-lg">
                                                    <h4 className="text-sm font-semibold text-accent mb-2 flex items-center gap-1.5">
                                                        <Sparkles className="w-4 h-4" />
                                                        AI Recommendation
                                                    </h4>
                                                    <p className="text-sm text-text-secondary leading-relaxed">
                                                        {aiSummary.recommendation}
                                                    </p>
                                                </div>

                                                <p className="text-[11px] text-muted-foreground/50 text-center italic">
                                                    Based on ATS screening analysis (v{data.screening?.confidenceScore ? `${data.screening.confidenceScore}% confidence` : 'standard'})
                                                </p>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                                <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                                                    <Brain className="w-6 h-6 text-muted-foreground/40" />
                                                </div>
                                                <h4 className="text-sm font-medium text-foreground mb-1">No AI Analysis Available</h4>
                                                <p className="text-xs text-muted-foreground max-w-sm">
                                                    This candidate has not been screened by the AI yet. Submit their application to an active job to generate an AI screening analysis.
                                                </p>
                                            </div>
                                        )}
                                    </TabsContent>

                                    {/* ── Timeline Tab ──────────────────────────── */}
                                    <TabsContent value="timeline" className="mt-0 h-full">
                                        <CandidateTimeline candidateId={selectedCandidateId!} />
                                    </TabsContent>

                                    {/* ── Applications Tab ──────────────────────── */}
                                    <TabsContent value="applications" className="mt-0 space-y-4">
                                        {data.applications?.length ? (
                                            data.applications.map(app => (
                                                <div key={app._id} className="p-4 border border-line rounded-lg bg-card/50">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h4 className="font-medium">
                                                                {typeof app.jobId === 'object' ? app.jobId.title : 'Unknown Job'}
                                                            </h4>
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                Applied: {format(new Date(app.submittedAt), 'MMM dd, yyyy')}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="secondary" className="capitalize">
                                                                {app.status.toLowerCase()}
                                                            </Badge>
                                                            <button
                                                                onClick={() => setSchedulingAppId(schedulingAppId === app._id ? null : app._id)}
                                                                className="p-1 text-muted-foreground hover:text-accent transition-colors rounded"
                                                                title="Schedule interview"
                                                            >
                                                                {schedulingAppId === app._id ? <X className="w-4 h-4" /> : <CalendarPlus className="w-4 h-4" />}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Schedule Interview Mini-Form */}
                                                    {schedulingAppId === app._id && (
                                                        <div className="mt-4 pt-4 border-t border-line space-y-3 animate-in slide-in-from-top-2 duration-200">
                                                            <p className="text-xs font-medium text-muted-foreground">Schedule Interview</p>
                                                            <Select
                                                                value={interviewForm.type}
                                                                onValueChange={(v) => setInterviewForm(f => ({ ...f, type: v as any }))}
                                                            >
                                                                <SelectTrigger className="h-8 text-xs bg-card border-line">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="SCREENING">Screening</SelectItem>
                                                                    <SelectItem value="TECHNICAL">Technical</SelectItem>
                                                                    <SelectItem value="BEHAVIORAL">Behavioral</SelectItem>
                                                                    <SelectItem value="SYSTEM_DESIGN">System Design</SelectItem>
                                                                    <SelectItem value="FINAL">Final Round</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <div>
                                                                    <p className="text-[10px] text-muted-foreground mb-1">Start</p>
                                                                    <Input
                                                                        type="datetime-local"
                                                                        value={interviewForm.startTime}
                                                                        onChange={e => setInterviewForm(f => ({ ...f, startTime: e.target.value }))}
                                                                        className="h-8 text-xs bg-card"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] text-muted-foreground mb-1">End</p>
                                                                    <Input
                                                                        type="datetime-local"
                                                                        value={interviewForm.endTime}
                                                                        onChange={e => setInterviewForm(f => ({ ...f, endTime: e.target.value }))}
                                                                        className="h-8 text-xs bg-card"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <Input
                                                                placeholder="Meeting link (optional)"
                                                                value={interviewForm.meetingLink}
                                                                onChange={e => setInterviewForm(f => ({ ...f, meetingLink: e.target.value }))}
                                                                className="h-8 text-xs bg-card"
                                                            />
                                                            <button
                                                                onClick={() => {
                                                                    const jobId = typeof app.jobId === 'object' ? app.jobId._id : app.jobId
                                                                    scheduleInterviewMutation.mutate({
                                                                        candidateId: data.candidate._id,
                                                                        interviewerId: data.candidate._id, // Will be updated to current user in a future iteration
                                                                        jobId,
                                                                        applicationId: app._id,
                                                                        title: `${interviewForm.type.replace('_', ' ')} Interview — ${data.candidate.firstName || ''} ${data.candidate.lastName || ''}`.trim(),
                                                                        type: interviewForm.type,
                                                                        startTime: new Date(interviewForm.startTime).toISOString(),
                                                                        endTime: new Date(interviewForm.endTime).toISOString(),
                                                                        meetingLink: interviewForm.meetingLink || undefined,
                                                                    })
                                                                }}
                                                                disabled={!interviewForm.startTime || !interviewForm.endTime || scheduleInterviewMutation.isPending}
                                                                className="w-full py-1.5 text-xs font-medium bg-accent text-accent-foreground rounded-md hover:opacity-90 disabled:opacity-40 transition-opacity"
                                                            >
                                                                {scheduleInterviewMutation.isPending ? 'Scheduling…' : 'Schedule'}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-muted-foreground text-center py-8">
                                                No applications found for this candidate.
                                            </p>
                                        )}
                                    </TabsContent>

                                    {/* ── AI Insights Tab ───────────────────────── */}
                                    <TabsContent value="ai-insights" className="mt-0">
                                        <AiInsightsTab
                                            candidateId={selectedCandidateId!}
                                            jobId={firstJobId}
                                        />
                                    </TabsContent>

                                    {/* ── Resume Tab ─────────────────────────────── */}
                                    <TabsContent value="resume" className="mt-0 h-full flex flex-col items-center justify-center">
                                        {data.candidate.resumeUrl ? (
                                            <div className="flex flex-col items-center gap-4 text-center">
                                                <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                                                    <ExternalLink className="w-8 h-8" />
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-foreground">Resume on File</h3>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        Click below to view or download the candidate&apos;s resume.
                                                    </p>
                                                </div>
                                                <a
                                                    href={data.candidate.resumeUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="px-4 py-2 bg-accent text-accent-foreground font-medium rounded-md hover:opacity-90 transition-opacity"
                                                >
                                                    View Resume
                                                </a>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">No resume uploaded.</p>
                                        )}
                                    </TabsContent>
                                </div>
                            </Tabs>
                        </div>
                    </>
                ) : (
                    <div className="flex h-full items-center justify-center">
                        <p className="text-muted-foreground">Candidate not found.</p>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    )
}
