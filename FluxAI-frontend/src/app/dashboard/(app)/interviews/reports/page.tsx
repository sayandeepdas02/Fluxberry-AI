"use client"

import { PageContainer } from "@/components/dashboard/page-container"
import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api/client"
import { ApiResponse } from "@/lib/api/types"
import { assessmentsApi } from "@/lib/api/assessments"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/dashboard/empty-state"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import {
    FileBarChart, Loader2, Clock, Target, TrendingUp,
    CheckCircle, XCircle, ChevronDown, AlertTriangle, Brain,
    Shield, MessageSquare, Zap, Users,
} from "lucide-react"
import { useState, useMemo } from "react"

// ── Types ────────────────────────────────────────────────
interface EvaluationMetrics {
    correctnessScore: number
    depthScore: number
    communicationScore: number
    relevanceScore: number
    feedback?: string
    redFlags?: string[]
}

interface PerQuestionEval {
    phase: string
    question: string
    answer: string
    metrics: EvaluationMetrics
}

interface AISessionResult {
    _id: string
    attemptId: string
    candidateId: any
    organizationId: string
    status: string
    currentPhase: string
    aiConfig: { role: string; difficulty: string; grillingIntensity: string }
    transcript: { speaker: string; text: string; timestamp: string }[]
    evaluations: PerQuestionEval[]
    overallScore: number
    recommendation: 'HIRE' | 'NO_HIRE' | 'FURTHER_REVIEW'
    scoreBreakdown: Record<string, number>
    startedAt: string
    endedAt: string
}

interface AttemptResult {
    attempt: {
        id: string
        candidateId: any
        assessmentId: any
        status: string
        startedAt: string | null
        submittedAt: string | null
    }
    rounds: {
        roundType: string
        status: string
        timeSpentSeconds: number
        evaluation: { score: number; maxScore: number; metadata: any } | null
    }[]
    totalScore: number
    maxScore: number
    percentage: number
    proctoring?: { totalEvents: number; flagged: boolean }
}

const DIMENSION_LABELS: Record<string, { label: string; icon: typeof Shield }> = {
    projectDepth: { label: 'Project Depth', icon: Target },
    fundamentals: { label: 'Technical Fundamentals', icon: Brain },
    communication: { label: 'Communication', icon: MessageSquare },
    culture: { label: 'Culture Fit', icon: Users },
}

const RECOMMENDATION_STYLES: Record<string, { label: string; class: string }> = {
    HIRE: { label: '✅ Hire', class: 'bg-emerald-500/10 text-emerald-400' },
    NO_HIRE: { label: '🚫 No Hire', class: 'bg-red-500/10 text-red-400' },
    FURTHER_REVIEW: { label: '🔍 Further Review', class: 'bg-amber-500/10 text-amber-400' },
}

const PHASE_LABELS: Record<string, string> = {
    INTRO: 'Introduction',
    PROJECT_DEEP_DIVE: 'Project Deep Dive',
    FUNDAMENTALS: 'Fundamentals',
    CULTURE_FIT: 'Culture Fit',
    SUMMARY: 'Summary',
}

export default function InterviewReportsPage() {
    const [selectedAssessmentId, setSelectedAssessmentId] = useState('')
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [expandedTab, setExpandedTab] = useState<'breakdown' | 'questions' | 'strengths'>('breakdown')

    // Fetch assessments
    const { data: assessmentsRes } = useQuery({
        queryKey: ['assessments'],
        queryFn: () => assessmentsApi.list(),
    })
    const assessments = assessmentsRes?.data || []

    // Fetch attempt results
    const { data: resultsRes, isLoading: resultsLoading } = useQuery({
        queryKey: ['assessment-results', selectedAssessmentId],
        queryFn: () => apiClient.get<AttemptResult[]>(`/assessments/${selectedAssessmentId}/results`),
        enabled: !!selectedAssessmentId,
    })
    const results = resultsRes?.data || []

    // Fetch AI sessions per attempt (one session per attempt)
    const { data: sessionsRes } = useQuery({
        queryKey: ['ai-sessions', selectedAssessmentId, results.map(r => r.attempt.id)],
        queryFn: async () => {
            if (results.length === 0) return { data: [] }
            // Fetch sessions for each attempt — the backend stores sessions by attemptId
            const sessionPromises = results.map(r =>
                apiClient.get<AISessionResult[]>(`/ai-interview/orchestrator/sessions`, { attemptId: r.attempt.id })
                    .then(res => res?.data?.[0] || null)
                    .catch(() => null)
            )
            const sessions = await Promise.all(sessionPromises)
            return { data: sessions.filter(Boolean) as AISessionResult[] }
        },
        enabled: !!selectedAssessmentId && results.length > 0,
    })
    const aiSessions = sessionsRes?.data || []

    // Match AI sessions to attempt results
    const getSessionForAttempt = (attemptId: string): AISessionResult | undefined =>
        aiSessions.find(s => s.attemptId === attemptId)

    // Aggregate stats
    const avgScore = results.length > 0
        ? Math.round(results.reduce((a, r) => a + r.percentage, 0) / results.length)
        : 0
    const passCount = results.filter(r => r.percentage >= 60).length
    const topScore = results.length > 0 ? Math.max(...results.map(r => r.percentage)) : 0
    const hireCount = aiSessions.filter(s => s.recommendation === 'HIRE').length

    // Per-dimension aggregation across all AI sessions
    const dimensionAverages = useMemo(() => {
        if (aiSessions.length === 0) return null
        const dims: Record<string, number[]> = {}
        aiSessions.forEach(s => {
            if (!s.scoreBreakdown) return
            Object.entries(s.scoreBreakdown).forEach(([k, v]) => {
                if (!dims[k]) dims[k] = []
                dims[k].push(v)
            })
        })
        return Object.entries(dims).map(([k, vals]) => ({
            key: k,
            label: DIMENSION_LABELS[k]?.label || k,
            avg: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
        }))
    }, [aiSessions])

    return (
        <PageContainer title="Interview Reports" description="Comprehensive AI evaluation reports with structured scoring breakdown.">
            <div className="mt-6 w-full flex flex-col space-y-6">
                {/* Assessment selector */}
                <div className="flex items-center gap-4">
                    <Select value={selectedAssessmentId} onValueChange={setSelectedAssessmentId}>
                        <SelectTrigger className="max-w-sm bg-card border-line"><SelectValue placeholder="Select Assessment" /></SelectTrigger>
                        <SelectContent>{assessments.map((a) => <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>)}</SelectContent>
                    </Select>
                    {selectedAssessmentId && <p className="text-sm text-muted-foreground">{results.length} result{results.length !== 1 ? 's' : ''}</p>}
                </div>

                {!selectedAssessmentId ? (
                    <EmptyState icon={FileBarChart} title="Select an assessment" description="Choose an assessment to see detailed AI evaluation reports." />
                ) : resultsLoading ? (
                    <div className="flex h-64 items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
                ) : results.length === 0 ? (
                    <EmptyState icon={FileBarChart} title="No results yet" description="No candidates have completed this assessment yet." />
                ) : (
                    <>
                        {/* Summary cards */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div className="p-4 border border-line rounded-lg bg-card/50 text-center">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Candidates</p>
                                <p className="text-2xl font-bold mt-1">{results.length}</p>
                            </div>
                            <div className="p-4 border border-line rounded-lg bg-card/50 text-center">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Avg Score</p>
                                <p className={`text-2xl font-bold mt-1 ${avgScore >= 70 ? 'text-emerald-400' : avgScore >= 50 ? 'text-amber-400' : 'text-red-400'}`}>{avgScore}%</p>
                            </div>
                            <div className="p-4 border border-line rounded-lg bg-card/50 text-center">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Pass Rate</p>
                                <p className="text-2xl font-bold mt-1 text-emerald-400">{results.length > 0 ? Math.round((passCount / results.length) * 100) : 0}%</p>
                            </div>
                            <div className="p-4 border border-line rounded-lg bg-card/50 text-center">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Top Score</p>
                                <p className="text-2xl font-bold mt-1">{topScore}%</p>
                            </div>
                            <div className="p-4 border border-line rounded-lg bg-card/50 text-center">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">AI: Hire</p>
                                <p className="text-2xl font-bold mt-1 text-emerald-400">{hireCount}</p>
                            </div>
                        </div>

                        {/* Dimension averages across all candidates */}
                        {dimensionAverages && dimensionAverages.length > 0 && (
                            <div className="border border-line rounded-lg bg-card/50 p-4">
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                                    <Brain className="w-3.5 h-3.5" /> Average Score by Dimension
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {dimensionAverages.map(d => (
                                        <div key={d.key} className="p-3 bg-muted/20 rounded-lg">
                                            <p className="text-xs font-medium">{d.label}</p>
                                            <p className={`text-lg font-bold mt-1 ${d.avg >= 70 ? 'text-emerald-400' : d.avg >= 50 ? 'text-amber-400' : 'text-red-400'}`}>{d.avg}/100</p>
                                            <div className="w-full h-1 bg-muted rounded-full mt-1 overflow-hidden">
                                                <div className={`h-full rounded-full ${d.avg >= 70 ? 'bg-emerald-500' : d.avg >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                    style={{ width: `${d.avg}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Individual Result Cards */}
                        <div className="space-y-3">
                            {results
                                .sort((a, b) => b.percentage - a.percentage)
                                .map((r) => {
                                    const candidateName = r.attempt.candidateId?.firstName
                                        ? `${r.attempt.candidateId.firstName} ${r.attempt.candidateId.lastName}`
                                        : r.attempt.candidateId?.email || 'Anonymous'
                                    const isExpanded = expandedId === r.attempt.id
                                    const passed = r.percentage >= 60
                                    const timeStr = r.rounds.reduce((a, rd) => a + (rd.timeSpentSeconds || 0), 0)
                                    const session = getSessionForAttempt(r.attempt.id)

                                    return (
                                        <div key={r.attempt.id} className="border border-line rounded-lg bg-card/50 overflow-hidden transition-colors hover:bg-card/80">
                                            {/* Summary row */}
                                            <div className="flex items-center justify-between p-4 cursor-pointer"
                                                onClick={() => { setExpandedId(isExpanded ? null : r.attempt.id); setExpandedTab('breakdown') }}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                                                        r.percentage >= 70 ? 'border-emerald-500 text-emerald-400'
                                                        : r.percentage >= 50 ? 'border-amber-500 text-amber-400'
                                                        : 'border-red-500 text-red-400'
                                                    }`}>{r.percentage}%</div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-medium text-sm">{candidateName}</p>
                                                            {session?.recommendation && (
                                                                <Badge className={`text-[10px] ${RECOMMENDATION_STYLES[session.recommendation]?.class}`}>
                                                                    {RECOMMENDATION_STYLES[session.recommendation]?.label}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                                            <span>{r.totalScore}/{r.maxScore} pts</span>
                                                            {timeStr > 0 && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{Math.round(timeStr / 60)} min</span>}
                                                            {session && <span className="flex items-center gap-1"><Brain className="w-3 h-3" />AI: {session.overallScore}/100</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {passed ? <Badge className="bg-emerald-500/10 text-emerald-400 text-xs gap-1"><CheckCircle className="w-3 h-3" />Passed</Badge>
                                                        : <Badge className="bg-red-500/10 text-red-400 text-xs gap-1"><XCircle className="w-3 h-3" />Failed</Badge>}
                                                    {r.proctoring?.flagged && <Badge className="bg-amber-500/10 text-amber-400 text-[10px]">⚠ Flagged</Badge>}
                                                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                </div>
                                            </div>

                                            {/* Expanded detail */}
                                            {isExpanded && (
                                                <div className="border-t border-line/50 animate-in slide-in-from-top-1 duration-200">
                                                    {/* Tabs */}
                                                    <div className="flex border-b border-line/50">
                                                        {(['breakdown', 'questions', 'strengths'] as const).map(tab => (
                                                            <button key={tab} onClick={() => setExpandedTab(tab)}
                                                                className={`px-4 py-2 text-xs font-medium capitalize transition-colors ${expandedTab === tab ? 'text-accent border-b-2 border-accent' : 'text-muted-foreground hover:text-foreground'}`}>
                                                                {tab === 'questions' ? 'Per-Question' : tab}
                                                            </button>
                                                        ))}
                                                    </div>

                                                    <div className="p-4">
                                                        {/* Breakdown tab */}
                                                        {expandedTab === 'breakdown' && (
                                                            <div className="space-y-4">
                                                                {/* Round scores */}
                                                                <div>
                                                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Round Scores</p>
                                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                                        {r.rounds.map((rd, i) => (
                                                                            <div key={i} className="p-3 bg-muted/20 rounded-lg">
                                                                                <div className="flex items-center justify-between">
                                                                                    <span className="text-xs font-semibold">{rd.roundType}</span>
                                                                                    <Badge className={`text-[10px] ${rd.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-muted text-muted-foreground'}`}>{rd.status}</Badge>
                                                                                </div>
                                                                                {rd.evaluation && (
                                                                                    <>
                                                                                        <div className="flex items-center justify-between mt-2">
                                                                                            <span className="text-xs text-muted-foreground">Score</span>
                                                                                            <span className={`text-sm font-bold ${(rd.evaluation.score / rd.evaluation.maxScore) >= 0.7 ? 'text-emerald-400' : (rd.evaluation.score / rd.evaluation.maxScore) >= 0.5 ? 'text-amber-400' : 'text-red-400'}`}>
                                                                                                {rd.evaluation.score}/{rd.evaluation.maxScore}
                                                                                            </span>
                                                                                        </div>
                                                                                        <div className="w-full h-1 bg-muted rounded-full mt-1 overflow-hidden">
                                                                                            <div className={`h-full rounded-full ${(rd.evaluation.score / rd.evaluation.maxScore) >= 0.7 ? 'bg-emerald-500' : (rd.evaluation.score / rd.evaluation.maxScore) >= 0.5 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                                                                style={{ width: `${(rd.evaluation.score / rd.evaluation.maxScore) * 100}%` }} />
                                                                                        </div>
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>

                                                                {/* AI dimension breakdown */}
                                                                {session?.scoreBreakdown && (
                                                                    <div>
                                                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">AI Dimension Breakdown</p>
                                                                        <div className="grid grid-cols-2 gap-3">
                                                                            {Object.entries(session.scoreBreakdown).map(([dim, score]) => (
                                                                                <div key={dim} className="p-3 bg-muted/20 rounded-lg">
                                                                                    <div className="flex items-center justify-between">
                                                                                        <span className="text-xs font-medium">{DIMENSION_LABELS[dim]?.label || dim}</span>
                                                                                        <span className={`text-sm font-bold ${score >= 70 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-red-400'}`}>{score}/100</span>
                                                                                    </div>
                                                                                    <div className="w-full h-1 bg-muted rounded-full mt-1.5 overflow-hidden">
                                                                                        <div className={`h-full rounded-full ${score >= 70 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                                                            style={{ width: `${score}%` }} />
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Per-Question tab */}
                                                        {expandedTab === 'questions' && session?.evaluations && (
                                                            <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                                                {session.evaluations.map((ev, i) => (
                                                                    <div key={i} className="p-3 bg-muted/10 rounded-lg border border-line/30">
                                                                        <div className="flex items-center justify-between mb-2">
                                                                            <Badge className="bg-muted text-muted-foreground text-[10px]">{PHASE_LABELS[ev.phase] || ev.phase}</Badge>
                                                                            <span className="text-[10px] text-muted-foreground">Q{i + 1}</span>
                                                                        </div>
                                                                        <p className="text-xs font-medium text-accent/80 mb-1">🤖 {ev.question}</p>
                                                                        <p className="text-xs text-text-secondary mb-2">👤 {ev.answer.length > 200 ? ev.answer.slice(0, 200) + '...' : ev.answer}</p>
                                                                        <div className="flex items-center gap-3 text-[10px]">
                                                                            <span className={ev.metrics.correctnessScore >= 7 ? 'text-emerald-400' : ev.metrics.correctnessScore >= 5 ? 'text-amber-400' : 'text-red-400'}>
                                                                                Correctness: {ev.metrics.correctnessScore}/10
                                                                            </span>
                                                                            <span className={ev.metrics.depthScore >= 7 ? 'text-emerald-400' : ev.metrics.depthScore >= 5 ? 'text-amber-400' : 'text-red-400'}>
                                                                                Depth: {ev.metrics.depthScore}/10
                                                                            </span>
                                                                            <span className={ev.metrics.communicationScore >= 7 ? 'text-emerald-400' : ev.metrics.communicationScore >= 5 ? 'text-amber-400' : 'text-red-400'}>
                                                                                Communication: {ev.metrics.communicationScore}/10
                                                                            </span>
                                                                            <span className={ev.metrics.relevanceScore >= 7 ? 'text-emerald-400' : ev.metrics.relevanceScore >= 5 ? 'text-amber-400' : 'text-red-400'}>
                                                                                Relevance: {ev.metrics.relevanceScore}/10
                                                                            </span>
                                                                        </div>
                                                                        {ev.metrics.feedback && <p className="text-[10px] text-muted-foreground/60 mt-1 italic">{ev.metrics.feedback}</p>}
                                                                        {ev.metrics.redFlags && ev.metrics.redFlags.length > 0 && (
                                                                            <div className="flex gap-1 mt-1">
                                                                                {ev.metrics.redFlags.map((f, j) => (
                                                                                    <span key={j} className="text-[9px] px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded">🚩 {f}</span>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                                {(!session.evaluations || session.evaluations.length === 0) && (
                                                                    <p className="text-sm text-muted-foreground text-center py-4">No per-question evaluations available.</p>
                                                                )}
                                                            </div>
                                                        )}

                                                        {expandedTab === 'questions' && !session && (
                                                            <p className="text-sm text-muted-foreground text-center py-4">No AI interview data available for this attempt.</p>
                                                        )}

                                                        {/* Strengths tab */}
                                                        {expandedTab === 'strengths' && (
                                                            <div className="space-y-4">
                                                                {session ? (
                                                                    <>
                                                                        {/* Auto-extracted strengths from high-scoring evals */}
                                                                        <div>
                                                                            <h4 className="text-xs font-semibold text-emerald-400 mb-2 flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" /> Strengths</h4>
                                                                            <ul className="space-y-1.5">
                                                                                {session.evaluations
                                                                                    .filter(ev => ev.metrics.correctnessScore >= 7)
                                                                                    .slice(0, 4)
                                                                                    .map((ev, i) => (
                                                                                        <li key={i} className="text-xs text-text-secondary flex items-start gap-2">
                                                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                                                                                            Strong in {PHASE_LABELS[ev.phase] || ev.phase}: scored {ev.metrics.correctnessScore}/10 correctness
                                                                                            {ev.metrics.feedback && ` — "${ev.metrics.feedback.slice(0, 80)}"`}
                                                                                        </li>
                                                                                    ))
                                                                                }
                                                                                {session.evaluations.filter(ev => ev.metrics.correctnessScore >= 7).length === 0 && (
                                                                                    <li className="text-xs text-muted-foreground italic">No standout strengths identified.</li>
                                                                                )}
                                                                            </ul>
                                                                        </div>
                                                                        <div>
                                                                            <h4 className="text-xs font-semibold text-amber-400 mb-2 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> Weaknesses</h4>
                                                                            <ul className="space-y-1.5">
                                                                                {session.evaluations
                                                                                    .filter(ev => ev.metrics.correctnessScore < 5)
                                                                                    .slice(0, 4)
                                                                                    .map((ev, i) => (
                                                                                        <li key={i} className="text-xs text-text-secondary flex items-start gap-2">
                                                                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                                                                                            Weak in {PHASE_LABELS[ev.phase] || ev.phase}: scored {ev.metrics.correctnessScore}/10
                                                                                            {ev.metrics.feedback && ` — "${ev.metrics.feedback.slice(0, 80)}"`}
                                                                                        </li>
                                                                                    ))
                                                                                }
                                                                                {session.evaluations.filter(ev => ev.metrics.correctnessScore < 5).length === 0 && (
                                                                                    <li className="text-xs text-muted-foreground italic">No significant weaknesses detected.</li>
                                                                                )}
                                                                            </ul>
                                                                        </div>
                                                                        {/* Red flags */}
                                                                        {(() => {
                                                                            const allFlags = session.evaluations.flatMap(ev => ev.metrics.redFlags || [])
                                                                            if (allFlags.length === 0) return null
                                                                            return (
                                                                                <div>
                                                                                    <h4 className="text-xs font-semibold text-red-400 mb-2 flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5" /> Red Flags</h4>
                                                                                    <div className="flex flex-wrap gap-1.5">
                                                                                        {allFlags.map((f, i) => <span key={i} className="text-[10px] px-2 py-0.5 bg-red-500/10 text-red-400 rounded-full">🚩 {f}</span>)}
                                                                                    </div>
                                                                                </div>
                                                                            )
                                                                        })()}
                                                                    </>
                                                                ) : (
                                                                    <p className="text-sm text-muted-foreground text-center py-4">No AI analysis data available.</p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                        </div>
                    </>
                )}
            </div>
        </PageContainer>
    )
}
