"use client"

/**
 * AI Interview Interface Wrapper
 * 
 * Wrapper component that provides the AI interview experience.
 * This integrates with the RoundRenderer and provides the full AI interview flow.
 */

import { AIInterface } from './ai-interview/ai-interface'
import { getAttemptId } from '@/features/candidate/lib/attempt-storage'
import { useParams } from 'next/navigation'

interface AIInterviewInterfaceProps {
    onComplete: () => void
}

export function AIInterviewInterface({ onComplete }: AIInterviewInterfaceProps) {
    const params = useParams()
    const assessmentId = params?.assessmentId as string
    const attemptId = getAttemptId(assessmentId)

    if (!attemptId) {
        return (
            <div className="p-10 text-center text-red-500">
                No active assessment attempt found.
            </div>
        )
    }

    return (
        <AIInterface
            attemptId={attemptId}
            assessmentTitle="AI Technical Interview"
            agentType="HR_GENERAL"
            onComplete={onComplete}
        />
    )
}
