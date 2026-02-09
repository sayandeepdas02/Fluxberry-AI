"use client"

/**
 * AI Interview Viewer Component
 * 
 * Read-only view of AI interview for recruiters:
 * - Interview status and duration
 * - Agent type used
 * - Full transcript with timestamps
 * - Audio playback (V1: placeholder for future integration)
 */

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Video,
    Clock,
    MessageSquare,
    User,
    Bot,
    Play,
    Pause,
    Volume2,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Timer
} from 'lucide-react'
import { attemptsApi, AISessionDetails, TranscriptEntry } from '@/lib/api/attempts'

interface AIInterviewViewerProps {
    attemptId: string
}

const STATUS_CONFIG = {
    COMPLETED: {
        label: 'Completed',
        icon: CheckCircle2,
        color: 'text-green-600 bg-green-50',
        badgeClass: 'bg-green-100 text-green-700 border-green-200',
    },
    IN_PROGRESS: {
        label: 'In Progress',
        icon: Clock,
        color: 'text-yellow-600 bg-yellow-50',
        badgeClass: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    },
    TIMEOUT: {
        label: 'Timed Out',
        icon: Timer,
        color: 'text-orange-600 bg-orange-50',
        badgeClass: 'bg-orange-100 text-orange-700 border-orange-200',
    },
    CANDIDATE_EXIT: {
        label: 'Ended Early',
        icon: XCircle,
        color: 'text-red-600 bg-red-50',
        badgeClass: 'bg-red-100 text-red-700 border-red-200',
    },
    FAILED: {
        label: 'Failed',
        icon: AlertCircle,
        color: 'text-red-600 bg-red-50',
        badgeClass: 'bg-red-100 text-red-700 border-red-200',
    },
    NOT_STARTED: {
        label: 'Not Started',
        icon: Clock,
        color: 'text-muted-foreground bg-muted',
        badgeClass: 'bg-muted text-muted-foreground',
    },
}

const AGENT_TYPE_LABELS: Record<string, string> = {
    FRONTEND_ENGINEER: 'Frontend Engineer',
    BACKEND_ENGINEER: 'Backend Engineer',
    FULLSTACK_ENGINEER: 'Fullstack Engineer',
    DEVOPS: 'DevOps',
    QA: 'QA Engineer',
    GENERAL: 'General',
}

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
                if (res.success && res.data) {
                    setDetails(res.data)
                } else {
                    setError(res.error?.message || 'Failed to load AI interview details')
                }
                setLoading(false)
            })
            .catch(() => {
                if (!cancelled) {
                    setError('Failed to load AI interview details')
                    setLoading(false)
                }
            })

        return () => { cancelled = true }
    }, [attemptId])

    if (loading) {
        return (
            <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                    Loading AI interview details...
                </CardContent>
            </Card>
        )
    }

    if (error || !details?.sessionId) {
        return (
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Video className="w-4 h-4 text-purple-600" />
                        AI Interview
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <AlertCircle className="w-4 h-4" />
                        {error || 'AI interview not conducted'}
                    </div>
                </CardContent>
            </Card>
        )
    }

    const statusConfig = STATUS_CONFIG[details.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.NOT_STARTED
    const StatusIcon = statusConfig.icon
    const duration = details.duration || 0
    const durationMinutes = Math.floor(duration / 60)
    const durationSeconds = duration % 60

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                        <Video className="w-4 h-4" />
                    </div>
                    <CardTitle className="text-base">AI Interview</CardTitle>
                </div>
                <Badge className={`${statusConfig.badgeClass} border`}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {statusConfig.label}
                </Badge>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Interview Meta */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div className="text-center">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Duration</p>
                        <p className="text-lg font-semibold mt-1">
                            {durationMinutes}:{durationSeconds.toString().padStart(2, '0')}
                        </p>
                    </div>
                    <div className="text-center border-x border-border">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Agent Type</p>
                        <p className="text-sm font-medium mt-1">
                            {AGENT_TYPE_LABELS[details.agentType || 'GENERAL'] || details.agentType}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Messages</p>
                        <p className="text-lg font-semibold mt-1">{details.transcript?.length || 0}</p>
                    </div>
                </div>

                {/* Audio Playback (V1: Read-only indicator) */}
                {details.mediaAssets?.audioAssetId && (
                    <div className="flex items-center gap-3 p-3 bg-neutral-100 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <Volume2 className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium">Audio Recording Available</p>
                            <p className="text-xs text-muted-foreground">
                                Full interview audio captured
                            </p>
                        </div>
                        <Button variant="outline" size="sm" disabled>
                            <Play className="w-4 h-4 mr-1" />
                            Play
                        </Button>
                    </div>
                )}

                {/* Transcript */}
                {details.transcript && details.transcript.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" />
                                Interview Transcript
                            </h4>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setExpandedTranscript(!expandedTranscript)}
                            >
                                {expandedTranscript ? 'Show Less' : 'Show All'}
                            </Button>
                        </div>

                        <div className={`space-y-3 ${expandedTranscript ? '' : 'max-h-80 overflow-y-auto'}`}>
                            {(expandedTranscript ? details.transcript : details.transcript.slice(0, 10)).map((entry, idx) => (
                                <TranscriptMessage key={idx} entry={entry} />
                            ))}

                            {!expandedTranscript && details.transcript.length > 10 && (
                                <p className="text-xs text-muted-foreground text-center py-2">
                                    Showing 10 of {details.transcript.length} messages
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Timestamps */}
                {details.startedAt && (
                    <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-4">
                        <span>Started: {new Date(details.startedAt).toLocaleString()}</span>
                        {details.endedAt && (
                            <span>Ended: {new Date(details.endedAt).toLocaleString()}</span>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function TranscriptMessage({ entry }: { entry: TranscriptEntry }) {
    const isAI = entry.speaker === 'AI'
    const timestamp = formatTimestamp(entry.timestamp)

    return (
        <div className={`flex gap-3 ${isAI ? '' : 'flex-row-reverse'}`}>
            <div className={`
                w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                ${isAI ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}
            `}>
                {isAI ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </div>
            <div className={`
                max-w-[80%] rounded-lg px-3 py-2 text-sm
                ${isAI ? 'bg-purple-50 text-purple-900' : 'bg-blue-50 text-blue-900'}
            `}>
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

function formatTimestamp(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
