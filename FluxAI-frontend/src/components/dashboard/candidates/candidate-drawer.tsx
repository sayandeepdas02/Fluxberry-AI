"use client"

import { useCandidatesStore } from '@/lib/store/candidates-store'
import { useQuery } from '@tanstack/react-query'
import { candidatesApi } from '@/lib/api/candidates'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Mail, Phone, ExternalLink, Sparkles, Briefcase, TrendingUp, TrendingDown } from 'lucide-react'
import { CandidateTimeline } from './candidate-timeline'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

// ── Mock AI Summary (will be replaced by real API later) ─────────
function generateMockAISummary(name: string) {
    return {
        overallFit: 'Strong',
        fitScore: 82,
        strengths: [
            'Relevant technical experience in target stack',
            'Strong communication skills demonstrated in portfolio',
            'Previous experience in similar domain',
        ],
        concerns: [
            'Limited leadership experience',
            'No prior startup environment exposure',
        ],
        recommendation: `${name} is a strong candidate for this role. Their technical background aligns well with requirements. Consider probing leadership readiness in the next interview round.`,
    }
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
    const aiSummary = data ? generateMockAISummary(candidateName) : null
    const applicationCount = data?.applications?.length || 0

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
                                        {aiSummary && (
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
                                                    AI-generated summary · May not reflect complete information
                                                </p>
                                            </>
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
