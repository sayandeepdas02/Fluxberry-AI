"use client"

import { PageContainer } from "@/components/dashboard/page-container"
import { ErrorBoundary } from "@/components/shared/error-boundary"
import { useQuery } from "@tanstack/react-query"
import { useApiMutation } from "@/lib/hooks/use-api-mutation"
import { apiClient } from "@/lib/api/client"
import { ApiResponse } from "@/lib/api/types"
import { assessmentsApi } from "@/lib/api/assessments"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { EmptyState } from "@/components/dashboard/empty-state"
import {
    Brain, Plus, Loader2, Play, Sparkles, Clock, Target, MessageSquare,
    CheckCircle, XCircle, ArrowRight, Timer, RotateCcw, Zap, Shield,
    AlertTriangle,
} from "lucide-react"
import { useState, useRef, useEffect, useCallback } from "react"
import { toast } from "sonner"

// ── Types matching the Orchestrator backend ──────────────
interface TranscriptEntry {
    speaker: 'AI' | 'CANDIDATE'
    text: string
    timestamp: string
}

interface PerQuestionEvaluation {
    phase: string
    question: string
    answer: string
    metrics: {
        correctnessScore: number
        depthScore: number
        communicationScore: number
        relevanceScore: number
        feedback?: string
        redFlags?: string[]
    }
}

interface OrchestratorSessionState {
    sessionId: string
    status: string
    currentPhase: string
    questionIndex: number
    followUpCount: number
    projectFollowUpCount: number
    transcript: TranscriptEntry[]
    lastAIMessage: string
    startedAt: string
    endedAt?: string
    overallScore?: number
    recommendation?: 'HIRE' | 'NO_HIRE' | 'FURTHER_REVIEW'
    scoreBreakdown?: Record<string, number>
}

interface TurnResponse {
    nextMessage: string
    currentPhase: string
    isComplete: boolean
}

interface CreateSessionResponse {
    sessionId: string
    firstMessage: string
}

const ROLES = [
    { value: 'BACKEND', label: 'Backend Engineer' },
    { value: 'FRONTEND', label: 'Frontend Engineer' },
    { value: 'FULLSTACK', label: 'Full Stack Engineer' },
    { value: 'DEVOPS', label: 'DevOps Engineer' },
]

const DIFFICULTIES = [
    { value: 'JUNIOR', label: 'Junior' },
    { value: 'MID', label: 'Mid-Level' },
    { value: 'SENIOR', label: 'Senior' },
]

const PHASE_LABELS: Record<string, { label: string; emoji: string }> = {
    INTRO: { label: 'Introduction', emoji: '👋' },
    PROJECT_DEEP_DIVE: { label: 'Project Deep Dive', emoji: '🔍' },
    FUNDAMENTALS: { label: 'Fundamentals', emoji: '🧠' },
    CULTURE_FIT: { label: 'Culture Fit', emoji: '🤝' },
    SUMMARY: { label: 'Summary', emoji: '📋' },
    COMPLETED: { label: 'Completed', emoji: '✅' },
}

const DIMENSION_LABELS: Record<string, string> = {
    projectDepth: 'Project Depth',
    fundamentals: 'Technical Fundamentals',
    communication: 'Communication',
    culture: 'Culture Fit',
}

const RECOMMENDATION_STYLES: Record<string, { label: string; class: string; icon: typeof CheckCircle }> = {
    HIRE: { label: 'Hire', class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle },
    NO_HIRE: { label: 'No Hire', class: 'bg-red-500/10 text-red-400 border-red-500/20', icon: XCircle },
    FURTHER_REVIEW: { label: 'Further Review', class: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: AlertTriangle },
}

export default function AIInterviewsPage() {
    // Setup state
    const [showCreate, setShowCreate] = useState(false)
    const [role, setRole] = useState('BACKEND')
    const [difficulty, setDifficulty] = useState('MID')
    const [duration, setDuration] = useState('30')
    const [intensity, setIntensity] = useState('MEDIUM')
    const [attemptId, setAttemptId] = useState('')

    // Session state
    const [sessionId, setSessionId] = useState<string | null>(null)
    const [sessionState, setSessionState] = useState<OrchestratorSessionState | null>(null)
    const [candidateAnswer, setCandidateAnswer] = useState('')
    const [isThinking, setIsThinking] = useState(false)
    const [elapsedSeconds, setElapsedSeconds] = useState(0)
    const [showEvalTab, setShowEvalTab] = useState<'report' | 'transcript' | 'per-question'>('report')

    const chatEndRef = useRef<HTMLDivElement>(null)
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    // Assessment list for attemptId selector
    const { data: assessmentsRes } = useQuery({
        queryKey: ['assessments'],
        queryFn: () => assessmentsApi.list(),
        enabled: showCreate,
    })
    const assessments = (assessmentsRes?.data || []).filter(a => a.status === 'ACTIVE')

    // Auto-scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [sessionState?.transcript.length])

    // Timer
    useEffect(() => {
        if (sessionId && sessionState?.status === 'ACTIVE') {
            timerRef.current = setInterval(() => setElapsedSeconds(s => s + 1), 1000)
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current) }
    }, [sessionId, sessionState?.status])

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60)
        const sec = s % 60
        return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
    }

    // Create session
    const createMutation = useApiMutation({
        mutationFn: () => apiClient.post<CreateSessionResponse>('/ai-interview/orchestrator/sessions', {
            attemptId,
            aiConfig: { role, difficulty, maxDurationMinutes: parseInt(duration), grillingIntensity: intensity },
        }),
        successMessage: 'AI Interview session started',
        errorMessage: 'Failed to create session — ensure an active assessment attempt exists',
        onSuccess: async (res) => {
            if (res.data) {
                setSessionId(res.data.sessionId)
                setShowCreate(false)
                setElapsedSeconds(0)
                // Fetch full session state
                const state = await apiClient.get<OrchestratorSessionState>(`/ai-interview/orchestrator/sessions/${res.data.sessionId}`)
                if (state.data) setSessionState(state.data)
            }
        },
    })

    // Submit turn
    const turnMutation = useApiMutation({
        mutationFn: (answer: string) =>
            apiClient.post<TurnResponse>(`/ai-interview/orchestrator/sessions/${sessionId}/turn`, { answer }),
        errorMessage: 'Failed to submit answer',
        onMutate: () => setIsThinking(true),
        onSuccess: async (res) => {
            setIsThinking(false)
            setCandidateAnswer('')
            // Fetch updated transcript (handles both complete and in-progress)
            const state = await apiClient.get<OrchestratorSessionState>(`/ai-interview/orchestrator/sessions/${sessionId}`)
            if (state.data) setSessionState(state.data)
        },
        onError: () => { setIsThinking(false) },
    })

    // Complete session manually
    const completeMutation = useApiMutation({
        mutationFn: () => apiClient.post<any>(`/ai-interview/orchestrator/sessions/${sessionId}/complete`),
        successMessage: 'Interview completed',
        onSuccess: async () => {
            const state = await apiClient.get<OrchestratorSessionState>(`/ai-interview/orchestrator/sessions/${sessionId}`)
            if (state.data) setSessionState(state.data)
        },
    })

    // Resume (refetch session state)
    const resumeSession = useCallback(async (sid: string) => {
        const state = await apiClient.get<OrchestratorSessionState>(`/ai-interview/orchestrator/sessions/${sid}`)
        if (state.data) {
            setSessionId(sid)
            setSessionState(state.data)
            if (state.data.startedAt) {
                setElapsedSeconds(Math.floor((Date.now() - new Date(state.data.startedAt).getTime()) / 1000))
            }
        }
    }, [])

    const isCompleted = sessionState?.status === 'COMPLETED'
    const currentPhase = sessionState?.currentPhase || 'INTRO'
    const transcript = sessionState?.transcript || []
    const phaseInfo = PHASE_LABELS[currentPhase] || PHASE_LABELS.INTRO
    const maxSeconds = parseInt(duration) * 60

    // Progress: count candidate answers (each answer = ~1 question answered)
    const answeredCount = transcript.filter(t => t.speaker === 'CANDIDATE').length
    const totalEstimate = 8 // rough estimate

    return (
        <PageContainer title="AI Interviews" description="AI-powered candidate evaluation — automated, intelligent, and fair.">
            <ErrorBoundary section="AI Interviews">
            <div className="mt-6 w-full flex flex-col space-y-6">
                {/* ── No Session / Setup ─────────────────────────── */}
                {!sessionId && (
                    <>
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">Create an AI interview to evaluate candidates automatically.</p>
                            <button onClick={() => setShowCreate(true)}
                                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-accent text-accent-foreground rounded-lg hover:opacity-90">
                                <Plus className="w-4 h-4" /> New AI Interview
                            </button>
                        </div>

                        {showCreate && (
                            <div className="p-6 border border-line rounded-lg bg-card/50 space-y-5 animate-in slide-in-from-top-2 duration-200">
                                <h3 className="font-semibold flex items-center gap-2"><Brain className="w-5 h-5 text-accent" /> Configure AI Interview</h3>

                                {/* Attempt ID (links to assessment) */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-muted-foreground">Assessment Attempt ID</label>
                                    <Input placeholder="Paste attempt ID from assessment..." value={attemptId} onChange={(e) => setAttemptId(e.target.value)}
                                        className="bg-card max-w-md font-mono text-xs" />
                                    <p className="text-[10px] text-muted-foreground/60">Required — links this interview to a candidate's assessment attempt.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-muted-foreground">Role</label>
                                        <Select value={role} onValueChange={setRole}>
                                            <SelectTrigger className="bg-card border-line"><SelectValue /></SelectTrigger>
                                            <SelectContent>{ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-muted-foreground">Difficulty</label>
                                        <Select value={difficulty} onValueChange={setDifficulty}>
                                            <SelectTrigger className="bg-card border-line"><SelectValue /></SelectTrigger>
                                            <SelectContent>{DIFFICULTIES.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-muted-foreground">Duration (minutes)</label>
                                        <Select value={duration} onValueChange={setDuration}>
                                            <SelectTrigger className="bg-card border-line"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="15">15 min</SelectItem>
                                                <SelectItem value="30">30 min</SelectItem>
                                                <SelectItem value="45">45 min</SelectItem>
                                                <SelectItem value="60">60 min</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-muted-foreground">Grilling Intensity</label>
                                        <Select value={intensity} onValueChange={setIntensity}>
                                            <SelectTrigger className="bg-card border-line"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="LOW">Low — Friendly</SelectItem>
                                                <SelectItem value="MEDIUM">Medium — Balanced</SelectItem>
                                                <SelectItem value="HIGH">High — Rigorous</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => {
                                        if (!attemptId.trim()) return toast.error('Attempt ID required')
                                        createMutation.mutate()
                                    }}
                                        disabled={createMutation.isPending}
                                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-accent text-accent-foreground rounded-lg hover:opacity-90 disabled:opacity-50">
                                        {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                                        Start Interview
                                    </button>
                                    <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
                                </div>
                            </div>
                        )}

                        {!showCreate && (
                            <EmptyState icon={Brain} title="No active interview"
                                description="Start an AI-powered interview session. The AI asks role-specific questions across 5 phases with structured evaluation."
                                actions={[{ label: 'Start Interview', onClick: () => setShowCreate(true), variant: 'primary' }]} />
                        )}
                    </>
                )}

                {/* ── Active Interview ─────────────────────────────── */}
                {sessionId && !isCompleted && (
                    <div className="space-y-4">
                        {/* Header bar */}
                        <div className="flex items-center justify-between p-4 bg-card/50 border border-line rounded-lg">
                            <div className="flex items-center gap-4">
                                <Brain className="w-5 h-5 text-accent" />
                                <div>
                                    <p className="text-sm font-medium">AI Interview — {phaseInfo.emoji} {phaseInfo.label}</p>
                                    <p className="text-xs text-muted-foreground">{role} · {difficulty}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                {/* Timer */}
                                <div className={`flex items-center gap-1.5 text-sm font-mono ${elapsedSeconds > maxSeconds * 0.9 ? 'text-red-400' : elapsedSeconds > maxSeconds * 0.7 ? 'text-amber-400' : 'text-foreground'}`}>
                                    <Timer className="w-4 h-4" />
                                    {formatTime(elapsedSeconds)} / {formatTime(maxSeconds)}
                                </div>
                                {/* Progress */}
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">Q{answeredCount + 1}</span>
                                    <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                                        <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${Math.min(100, (answeredCount / totalEstimate) * 100)}%` }} />
                                    </div>
                                </div>
                                <button onClick={() => completeMutation.mutate()}
                                    className="px-3 py-1.5 text-xs font-medium bg-red-500/10 text-red-400 rounded-md hover:bg-red-500/20 transition-colors">
                                    End Interview
                                </button>
                            </div>
                        </div>

                        {/* Chat */}
                        <div className="border border-line rounded-lg bg-card/50 overflow-hidden">
                            <div className="max-h-[450px] overflow-y-auto p-4 space-y-4">
                                {transcript.map((turn, i) => (
                                    <div key={i} className={`flex gap-3 ${turn.speaker === 'CANDIDATE' ? 'justify-end' : ''}`}>
                                        <div className={`max-w-[80%] p-4 rounded-lg ${
                                            turn.speaker === 'AI' ? 'bg-accent/10 border border-accent/20' : 'bg-muted border border-line'
                                        }`}>
                                            <p className="text-[10px] font-semibold text-muted-foreground mb-1.5">
                                                {turn.speaker === 'AI' ? '🤖 AI Interviewer' : '👤 Candidate'}
                                            </p>
                                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{turn.text}</p>
                                        </div>
                                    </div>
                                ))}
                                {isThinking && (
                                    <div className="flex gap-3">
                                        <div className="p-4 bg-accent/10 border border-accent/20 rounded-lg">
                                            <p className="text-[10px] font-semibold text-muted-foreground mb-1.5">🤖 AI Interviewer</p>
                                            <div className="flex items-center gap-1.5">
                                                <Loader2 className="w-4 h-4 animate-spin text-accent" />
                                                <span className="text-xs text-muted-foreground">Evaluating and generating next question...</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={chatEndRef} />
                            </div>

                            {/* Answer input */}
                            <div className="p-4 border-t border-line bg-muted/20">
                                <div className="flex gap-3">
                                    <textarea
                                        placeholder="Type the candidate's answer here..."
                                        value={candidateAnswer}
                                        onChange={(e) => setCandidateAnswer(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter' && e.metaKey && candidateAnswer.trim()) turnMutation.mutate(candidateAnswer) }}
                                        rows={3}
                                        className="flex-1 px-4 py-3 text-sm bg-card border border-line rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-accent"
                                        disabled={isThinking}
                                    />
                                    <div className="flex flex-col gap-2 self-end">
                                        <button onClick={() => {
                                            if (!candidateAnswer.trim()) return toast.error('Enter an answer')
                                            turnMutation.mutate(candidateAnswer)
                                        }}
                                            disabled={turnMutation.isPending || !candidateAnswer.trim()}
                                            className="px-4 py-2.5 bg-accent text-accent-foreground font-medium rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5 text-sm">
                                            {isThinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                                            Submit
                                        </button>
                                        <span className="text-[9px] text-muted-foreground text-center">⌘ + Enter</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Completed — Evaluation Report ───────────────── */}
                {sessionId && isCompleted && sessionState && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold flex items-center gap-2"><Sparkles className="w-5 h-5 text-accent" /> AI Evaluation Report</h3>
                            <button onClick={() => { setSessionId(null); setSessionState(null) }}
                                className="text-sm text-muted-foreground hover:text-foreground">← New Interview</button>
                        </div>

                        {/* Recommendation banner */}
                        {sessionState.recommendation && (
                            <div className={`flex items-center gap-3 p-4 border rounded-lg ${RECOMMENDATION_STYLES[sessionState.recommendation]?.class}`}>
                                {(() => { const Icon = RECOMMENDATION_STYLES[sessionState.recommendation]?.icon || AlertTriangle; return <Icon className="w-5 h-5" /> })()}
                                <div>
                                    <p className="text-sm font-semibold">Recommendation: {RECOMMENDATION_STYLES[sessionState.recommendation]?.label}</p>
                                    <p className="text-xs opacity-80 mt-0.5">
                                        {sessionState.recommendation === 'HIRE' && 'Strong performance across all dimensions. Proceed to next stage.'}
                                        {sessionState.recommendation === 'NO_HIRE' && 'Significant gaps identified. Not recommended for this role at this level.'}
                                        {sessionState.recommendation === 'FURTHER_REVIEW' && 'Borderline performance. Manual review by the hiring team is recommended.'}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Overall Score */}
                        <div className="p-6 border border-line rounded-lg bg-gradient-to-br from-card/80 to-accent/5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Overall Score</p>
                                    <p className="text-4xl font-bold mt-1">{sessionState.overallScore ?? 0}<span className="text-lg text-muted-foreground">/100</span></p>
                                </div>
                                <div className={`w-20 h-20 rounded-full flex items-center justify-center text-xl font-bold border-4 ${
                                    (sessionState.overallScore ?? 0) >= 70 ? 'border-emerald-500 text-emerald-400'
                                    : (sessionState.overallScore ?? 0) >= 50 ? 'border-amber-500 text-amber-400'
                                    : 'border-red-500 text-red-400'
                                }`}>
                                    {sessionState.overallScore ?? 0}
                                </div>
                            </div>
                        </div>

                        {/* Score Breakdown — structured by dimension */}
                        {sessionState.scoreBreakdown && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Object.entries(sessionState.scoreBreakdown).map(([dim, score]) => (
                                    <div key={dim} className="p-4 border border-line rounded-lg bg-card/50">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="text-sm font-semibold">{DIMENSION_LABELS[dim] || dim}</h4>
                                            <span className={`text-sm font-bold ${score >= 70 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                                                {score}/100
                                            </span>
                                        </div>
                                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full transition-all ${score >= 70 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                style={{ width: `${score}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Tabs: Report / Transcript / Per-Question */}
                        <div className="border border-line rounded-lg bg-card/50 overflow-hidden">
                            <div className="flex border-b border-line">
                                {(['report', 'transcript', 'per-question'] as const).map(tab => (
                                    <button key={tab} onClick={() => setShowEvalTab(tab)}
                                        className={`px-4 py-2.5 text-xs font-medium capitalize transition-colors ${showEvalTab === tab ? 'text-accent border-b-2 border-accent bg-accent/5' : 'text-muted-foreground hover:text-foreground'}`}>
                                        {tab === 'per-question' ? 'Per-Question' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                                    </button>
                                ))}
                            </div>

                            <div className="p-4">
                                {showEvalTab === 'report' && (
                                    <div className="space-y-4">
                                        <p className="text-xs text-muted-foreground">
                                            Interview duration: {sessionState.startedAt && sessionState.endedAt
                                                ? `${Math.round((new Date(sessionState.endedAt).getTime() - new Date(sessionState.startedAt).getTime()) / 60000)} minutes`
                                                : 'N/A'
                                            } · Questions answered: {transcript.filter(t => t.speaker === 'CANDIDATE').length}
                                        </p>
                                        <p className="text-sm text-text-secondary leading-relaxed">
                                            The candidate was evaluated across {Object.keys(sessionState.scoreBreakdown || {}).length} dimensions using a role-weighted rubric for {role} ({difficulty}).
                                        </p>
                                    </div>
                                )}

                                {showEvalTab === 'transcript' && (
                                    <div className="max-h-[400px] overflow-y-auto space-y-3">
                                        {transcript.map((t, i) => (
                                            <div key={i} className={`text-sm ${t.speaker === 'AI' ? 'text-accent' : 'text-foreground'}`}>
                                                <span className="font-semibold text-xs">{t.speaker === 'AI' ? '🤖 AI' : '👤 Candidate'}:</span>
                                                <p className="text-text-secondary mt-0.5 whitespace-pre-wrap">{t.text}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {showEvalTab === 'per-question' && (
                                    <div className="space-y-3 text-sm text-muted-foreground">
                                        <p>Per-question evaluations are stored server-side. Each answer was scored on 4 axes:</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="p-3 bg-muted/20 rounded-lg"><Shield className="w-4 h-4 mb-1 text-blue-400" /><p className="text-xs font-medium">Correctness (0-10)</p></div>
                                            <div className="p-3 bg-muted/20 rounded-lg"><Target className="w-4 h-4 mb-1 text-purple-400" /><p className="text-xs font-medium">Depth (0-10)</p></div>
                                            <div className="p-3 bg-muted/20 rounded-lg"><MessageSquare className="w-4 h-4 mb-1 text-emerald-400" /><p className="text-xs font-medium">Communication (0-10)</p></div>
                                            <div className="p-3 bg-muted/20 rounded-lg"><Zap className="w-4 h-4 mb-1 text-amber-400" /><p className="text-xs font-medium">Relevance (0-10)</p></div>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground/50 italic">Scores are weighted by the {role} rubric and aggregated into the dimension breakdown above.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
            </ErrorBoundary>
        </PageContainer>
    )
}
