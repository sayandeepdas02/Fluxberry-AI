"use client"

/**
 * AI Interview Interface
 * 
 * Main component that orchestrates the AI interview flow:
 * 1. Pre-interview (permissions, consent)
 * 2. Interview session (WebRTC, transcript)
 * 3. Completion screen
 */

import { useState, useCallback, useEffect } from 'react'
import { PreInterviewScreen } from './pre-interview'
import { InterviewSession } from './interview-session'
import { InterviewComplete } from './interview-complete'
import { attemptsApi, AISessionStartResponse, AISessionEndReason } from '@/lib/api/attempts'
import { Loader2 } from 'lucide-react'

interface AIInterfaceProps {
    attemptId: string
    assessmentTitle: string
    agentType?: string
    onComplete: () => void
}

type AIInterviewPhase = 'pre-interview' | 'starting' | 'interview' | 'ending' | 'complete'

export function AIInterface({
    attemptId,
    assessmentTitle,
    agentType = 'HR_GENERAL',
    onComplete,
}: AIInterfaceProps) {
    const [phase, setPhase] = useState<AIInterviewPhase>('pre-interview')
    const [session, setSession] = useState<AISessionStartResponse | null>(null)
    const [endReason, setEndReason] = useState<AISessionEndReason>('COMPLETED')
    const [duration, setDuration] = useState(0)
    const [error, setError] = useState<string | null>(null)

    // Check for resumed session on mount
    useEffect(() => {
        checkExistingSession()
    }, [attemptId])

    const checkExistingSession = async () => {
        try {
            const res = await attemptsApi.getAISessionDetails(attemptId)
            if (res.success && res.data?.sessionId && res.data.status === 'IN_PROGRESS') {
                // There's an active session - try to resume
                // V1: For simplicity, we start fresh (V2: reconnect logic)
                console.log('Found existing session, will resume from pre-interview')
            }
        } catch (err) {
            // No existing session, proceed normally
        }
    }

    const handleStartInterview = useCallback(async () => {
        setPhase('starting')
        setError(null)

        try {
            const res = await attemptsApi.startAISession(attemptId, agentType)

            if (!res.success || !res.data) {
                throw new Error(res.error?.message || 'Failed to start AI session')
            }

            setSession(res.data)
            setPhase('interview')
        } catch (err) {
            console.error('Failed to start interview:', err)
            setError((err as Error).message)
            setPhase('pre-interview')
        }
    }, [attemptId, agentType])

    const handleEndInterview = useCallback(async (reason: AISessionEndReason) => {
        if (!session) return

        setPhase('ending')
        setEndReason(reason)

        try {
            const res = await attemptsApi.endAISession(attemptId, session.sessionId, reason)

            if (res.success && res.data) {
                setDuration(res.data.duration)
            }
        } catch (err) {
            console.error('Failed to end session:', err)
        }

        // Always transition to complete, even on error
        setPhase('complete')
    }, [attemptId, session])

    const handleCancel = useCallback(() => {
        // Navigate back to assessment (handled by parent)
        onComplete()
    }, [onComplete])

    const handleComplete = useCallback(() => {
        onComplete()
    }, [onComplete])

    // Loading states
    if (phase === 'starting' || phase === 'ending') {
        return (
            <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
                <div className="text-center space-y-4">
                    <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto" />
                    <p className="text-neutral-400">
                        {phase === 'starting' ? 'Starting interview...' : 'Saving your responses...'}
                    </p>
                </div>
            </div>
        )
    }

    // Error display
    if (error) {
        return (
            <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-8">
                <div className="max-w-md text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 flex items-center justify-center">
                        <span className="text-3xl">!</span>
                    </div>
                    <h2 className="text-xl font-bold">Unable to Start Interview</h2>
                    <p className="text-neutral-400">{error}</p>
                    <button
                        onClick={() => setError(null)}
                        className="text-orange-500 hover:text-orange-400 underline"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        )
    }

    // Phase rendering
    switch (phase) {
        case 'pre-interview':
            return (
                <PreInterviewScreen
                    assessmentTitle={assessmentTitle}
                    agentType={agentType}
                    durationMinutes={15}
                    onStartInterview={handleStartInterview}
                    onCancel={handleCancel}
                />
            )

        case 'interview':
            if (!session) return null
            return (
                <InterviewSession
                    attemptId={attemptId}
                    sessionId={session.sessionId}
                    ephemeralToken={session.ephemeralToken}
                    model={session.model}
                    voice={session.voice}
                    systemPrompt={session.systemPrompt}
                    durationSeconds={session.durationSeconds}
                    startedAt={session.startedAt}
                    onEndInterview={handleEndInterview}
                />
            )

        case 'complete':
            return (
                <InterviewComplete
                    status={endReason === 'ERROR' ? 'ERROR' : endReason}
                    duration={duration}
                    onContinue={handleComplete}
                />
            )

        default:
            return null
    }
}
