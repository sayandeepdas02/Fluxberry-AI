"use client"

/**
 * AI Interview Viewer Component
 *
 * Enhanced read-only view of AI screening for recruiters:
 * - Recommendation badge (HIRE / FURTHER_REVIEW / NO_HIRE)
 * - Overall AI score + SVG radar chart of dimension scores
 * - Score breakdown (project depth, fundamentals, communication, culture)
 * - Red flags from evaluations
 * - Full transcript with expand/collapse
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Video, Clock, MessageSquare, User, Bot,
    AlertTriangle, CheckCircle2, XCircle,
    ShieldAlert, Timer, AlertCircle
} from 'lucide-react'
import { attemptsApi, type AISessionDetails, type TranscriptEntry } from '@/lib/api/attempts'

interface AIInterviewViewerProps {
    attemptId: string
}

const RECOMMENDATION_CONFIG = {
    HIRE: { label: '✅ Hire', badgeClass: 'bg-green-100 text-green-800 border-green-300' },
    FURTHER_REVIEW: { label: '🔍 Further Review', badgeClass: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
    NO_HIRE: { label: '❌ No Hire', badgeClass: 'bg-red-100 text-red-800 border-red-300' },
}

const STATUS_CONFIG = {
    COMPLETED: { label: 'Completed', icon: CheckCircle2, badgeClass: 'bg-green-100 text-green-700 border-green-200' },
    IN_PROGRESS: { label: 'In Progress', icon: Clock, badgeClass: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    TIMEOUT: { label: 'Timed Out', icon: Timer, badgeClass: 'bg-orange-100 text-orange-700 border-orange-200' },
    CANDIDATE_EXIT: { label: 'Ended Early', icon: XCircle, badgeClass: 'bg-red-100 text-red-700 border-red-200' },
    FAILED: { label: 'Failed', icon: AlertCircle, badgeClass: 'bg-red-100 text-red-700 border-red-200' },
    NOT_STARTED: { label: 'Not Started', icon: Clock, badgeClass: 'bg-muted text-muted-foreground' },
}

// ── SVG Radar Chart (no library required) ────────────────────────────────────

const DIMENSIONS = [
    { key: 'projectDepth', label: 'Projects' },
    { key: 'fundamentals', label: 'Technical' },
    { key: 'communication', label: 'Communication' },
    { key: 'culture', label: 'Culture' },
] as const

function RadarChart({ scores }: { scores: Record<string, number> }) {
    const CX = 110, CY = 110, R = 80
    const n = DIMENSIONS.length
    const angleStep = (2 * Math.PI) / n

    const axes = DIMENSIONS.map((_, i) => {
        const angle = i * angleStep - Math.PI / 2
        return { x: CX + R * Math.cos(angle), y: CY + R * Math.sin(angle) }
    })

    const dataPoints = DIMENSIONS.map((d, i) => {
        const angle = i * angleStep - Math.PI / 2
        const r = ((scores[d.key] ?? 50) / 100) * R
        return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) }
    })

    const refPolygons = [25, 50, 75, 100].map(pct =>
        DIMENSIONS.map((_, i) => {
            const angle = i * angleStep - Math.PI / 2
            const r = (pct / 100) * R
            return `${CX + r * Math.cos(angle)},${CY + r * Math.sin(angle)}`
        }).join(' ')
    )

    const polygonPoints = dataPoints.map(p => `${p.x},${p.y}`).join(' ')

    return (
        <svg viewBox="0 0 220 220" className="w-48 h-48 mx-auto">
            {refPolygons.map((pts, i) => (
                <polygon key={i} points={pts} fill="none" stroke="#e5e7eb" strokeWidth="1" />
            ))}
            {axes.map((a, i) => (
                <line key={i} x1={CX} y1={CY} x2={a.x} y2={a.y} stroke="#d1d5db" strokeWidth="1" />
            ))}
            <polygon points={polygonPoints} fill="rgba(147,51,234,0.15)" stroke="rgb(147,51,234)" strokeWidth="2" />
            {dataPoints.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="rgb(147,51,234)" />
            ))}
            {DIMENSIONS.map((d, i) => {
                const angle = i * angleStep - Math.PI / 2
                const labelR = R + 18
                return (
                    <text key={i}
                        x={CX + labelR * Math.cos(angle)}
                        y={CY + labelR * Math.sin(angle)}
                        textAnchor="middle" dominantBaseline="middle"
                        fill="#6b7280" fontSize="9">
                        {d.label}
                    </text>
                )
            })}
        </svg>
    )
}

// ─────────────────────────────────────────────────────────────────────────────

export function AIInterviewViewer({ attemptId }: AIInterviewViewerProps) {
    const [details, setDetails] = useState<AISessionDetails | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [expandedTranscript, setExpandedTranscript] = useState(false)

    useEffect(() => {
        let cancelled = false
        attemptsApi.getAISessionDetails(attemptId)
            .then(res => {
                if (cancelled) return
                if (res.success && res.data) setDetails(res.data)
                else setError(res.error?.message || 'Failed to load AI interview details')
                setLoading(false)
            })
            .catch(() => {
                if (!cancelled) { setError('Failed to load AI interview details'); setLoading(false) }
            })
        return () => { cancelled = true }
    }, [attemptId])

    if (loading) return (
        <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">
            Loading AI screening analysis...
        </CardContent></Card>
    )

    if (error || !details?.sessionId) return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                    <Video className="w-4 h-4 text-purple-600" /> AI Screening
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <AlertCircle className="w-4 h-4" />
                    {error || 'AI interview not conducted for this candidate'}
                </div>
            </CardContent>
        </Card>
    )

    const statusConfig = STATUS_CONFIG[details.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.NOT_STARTED
    const StatusIcon = statusConfig.icon
    const duration = details.duration || 0
    const durationMinutes = Math.floor(duration / 60)
    const durationSeconds = duration % 60

    const breakdown: Record<string, number> = (details as any).scoreBreakdown || {}
    const recommendation = (details as any).recommendation as 'HIRE' | 'FURTHER_REVIEW' | 'NO_HIRE' | undefined
    const overallScore = (details as any).overallScore as number | undefined
    const recConfig = recommendation ? RECOMMENDATION_CONFIG[recommendation] : null
    const hasScores = Object.keys(breakdown).length > 0

    const redFlags: string[] = (details as any).evaluations
        ?.flatMap((ev: any) => ev.metrics?.redFlags ?? [])
        .filter(Boolean) ?? []

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                        <Video className="w-4 h-4" />
                    </div>
                    <CardTitle className="text-base">AI Screening Analysis</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                    {recConfig && (
                        <Badge className={`${recConfig.badgeClass} border text-sm font-semibold px-3 py-1`}>
                            {recConfig.label}
                        </Badge>
                    )}
                    <Badge className={`${statusConfig.badgeClass} border`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusConfig.label}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="space-y-6">

                {/* Score overview with radar */}
                {hasScores && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                        <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider text-center">
                                Competency Radar
                            </p>
                            <RadarChart scores={breakdown} />
                        </div>

                        <div className="space-y-4">
                            {overallScore !== undefined && (
                                <div className="text-center mb-2">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Overall AI Score</p>
                                    <p className="text-4xl text-purple-700 mt-1">
                                        {overallScore}
                                        <span className="text-lg text-muted-foreground">/100</span>
                                    </p>
                                </div>
                            )}
                            {DIMENSIONS.map(d => {
                                const score = breakdown[d.key] ?? 0
                                return (
                                    <div key={d.key} className="space-y-1">
                                        <div className="flex justify-between text-xs">
                                            <span className="font-medium text-neutral-700">{d.label}</span>
                                            <span className="text-muted-foreground">{score}/100</span>
                                        </div>
                                        <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all ${score >= 70 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                style={{ width: `${score}%` }}
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Interview meta */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg text-center">
                    <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Duration</p>
                        <p className="text-lg font-semibold mt-1">{durationMinutes}:{durationSeconds.toString().padStart(2, '0')}</p>
                    </div>
                    <div className="border-x border-border">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</p>
                        <p className="text-sm font-medium mt-1">{(details as any).aiConfig?.role ?? (details.agentType || '—')}</p>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Exchanges</p>
                        <p className="text-lg font-semibold mt-1">{details.transcript?.length || 0}</p>
                    </div>
                </div>

                {/* Red flags */}
                {redFlags.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium flex items-center gap-2 text-red-700">
                            <ShieldAlert className="w-4 h-4" />
                            Red Flags ({redFlags.length})
                        </h4>
                        <ul className="space-y-1">
                            {redFlags.map((flag, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-red-800 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                    {flag}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Transcript */}
                {details.transcript && details.transcript.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" />
                                Interview Transcript ({details.transcript.length} messages)
                            </h4>
                            <Button variant="ghost" size="sm" onClick={() => setExpandedTranscript(!expandedTranscript)}>
                                {expandedTranscript ? 'Show Less' : 'Show All'}
                            </Button>
                        </div>
                        <div className={`space-y-3 ${expandedTranscript ? '' : 'max-h-80 overflow-y-auto'}`}>
                            {(expandedTranscript ? details.transcript : details.transcript.slice(0, 8)).map((entry, idx) => (
                                <TranscriptMessage key={idx} entry={entry} />
                            ))}
                            {!expandedTranscript && details.transcript.length > 8 && (
                                <p className="text-xs text-muted-foreground text-center py-2">
                                    Showing 8 of {details.transcript.length} messages
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Timestamps */}
                {details.startedAt && (
                    <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-4">
                        <span>Started: {new Date(details.startedAt).toLocaleString()}</span>
                        {details.endedAt && <span>Ended: {new Date(details.endedAt).toLocaleString()}</span>}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function TranscriptMessage({ entry }: { entry: TranscriptEntry }) {
    const isAI = entry.speaker === 'AI'
    const ms = typeof entry.timestamp === 'number' ? entry.timestamp :
        (entry.timestamp ? new Date(entry.timestamp as any).getTime() : 0)
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    const timestamp = `${minutes}:${seconds.toString().padStart(2, '0')}`

    return (
        <div className={`flex gap-3 ${isAI ? '' : 'flex-row-reverse'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isAI ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                {isAI ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </div>
            <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${isAI ? 'bg-purple-50 text-purple-900' : 'bg-blue-50 text-blue-900'}`}>
                <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-medium ${isAI ? 'text-purple-600' : 'text-blue-600'}`}>
                        {isAI ? 'AI Interviewer' : 'Candidate'}
                    </span>
                    <span className="text-xs text-muted-foreground">{timestamp}</span>
                </div>
                <p className="whitespace-pre-wrap">{entry.text}</p>
            </div>
        </div>
    )
}
