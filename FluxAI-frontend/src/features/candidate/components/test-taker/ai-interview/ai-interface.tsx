"use client"

/**
 * AI Interview Interface — V2 (Async Recording)
 * 
 * Orchestrates the AI interview flow:
 * 1. Pre-interview (permissions, consent)
 * 2. Interview session (per-question recording + upload)
 * 3. Completion screen
 */

import { useState, useCallback, useEffect } from 'react'
import { PreInterviewScreen } from './pre-interview'
import { InterviewSession } from './interview-session'
import { InterviewComplete } from './interview-complete'
import { attemptsApi, AIQuestionConfig, AISessionEndReason } from '@/lib/api/attempts'
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
    const [sessionId, setSessionId] = useState<string>('')
    const [questions, setQuestions] = useState<AIQuestionConfig[]>([])
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
                // Resume existing session
                setSessionId(res.data.sessionId)
                setQuestions(res.data.questions || [])
                if (res.data.questions?.length > 0) {
                    setPhase('interview')
                }
            }
        } catch {
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

            setSessionId(res.data.sessionId)
            setQuestions(res.data.questions)
            setPhase('interview')
        } catch (err) {
            console.error('Failed to start interview:', err)
            setError((err as Error).message)
            setPhase('pre-interview')
        }
    }, [attemptId, agentType])

    const handleEndInterview = useCallback(async (reason: AISessionEndReason) => {
        setPhase('ending')
        setEndReason(reason)

        try {
            const res = await attemptsApi.endAISession(attemptId, sessionId, reason)
            if (res.success && res.data) {
                setDuration(res.data.duration)
            }
        } catch (err) {
            console.error('Failed to end session:', err)
        }

        setPhase('complete')
    }, [attemptId, sessionId])

    const handleCancel = useCallback(() => {
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
                        {phase === 'starting' ? 'Preparing your interview...' : 'Saving your responses...'}
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
            if (!sessionId || questions.length === 0) return null
            return (
                <InterviewSession
                    attemptId={attemptId}
                    sessionId={sessionId}
                    questions={questions}
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
