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
import { Loader2, Mail, Phone, ExternalLink, Sparkles, Briefcase, TrendingUp, TrendingDown, Brain, Shield, AlertTriangle } from 'lucide-react'
import { CandidateTimeline } from './candidate-timeline'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

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

export function CandidateDrawer() {
    const { isDrawerOpen, setDrawerOpen, selectedCandidateId } = useCandidatesStore()

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
                                                        <Badge variant="secondary" className="capitalize">
                                                            {app.status.toLowerCase()}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-muted-foreground text-center py-8">
                                                No applications found for this candidate.
                                            </p>
                                        )}
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
