"use client"

import { useRouter } from "next/navigation"
import { SecureShell } from "./secure-shell"
import { MCQInterface } from "./mcq-interface"
import { DSAInterface } from "./dsa-interface"
import { AIInterviewInterface } from "./ai-interview-interface"

// Mock Data - In real app, this comes from API/Context
const rounds = [
    { id: "1", type: "mcq", title: "Technical MCQ", duration: "45:00", totalQuestions: 30 },
    { id: "2", type: "dsa", title: "Hands-on Coding", duration: "60:00", totalQuestions: 4 },
    { id: "3", type: "ai", title: "AI Video Interview", duration: "15:00", totalQuestions: 5 }
]

export function RoundRenderer({ assessmentId, roundId }: { assessmentId: string, roundId: string }) {
    const router = useRouter()

    const roundIndex = rounds.findIndex(r => r.id === roundId)
    const currentRound = rounds[roundIndex]

    if (!currentRound) {
        return <div className="p-10 text-center">Invalid Round ID</div>
    }

    const handleNextRound = () => {
        if (roundIndex < rounds.length - 1) {
            router.push(`/assessment/${assessmentId}/round/${rounds[roundIndex + 1].id}`)
        } else {
            router.push(`/assessment/${assessmentId}/completed`)
        }
    }

    return (
        <SecureShell
            title={currentRound.title}
            roundIndex={roundIndex + 1}
            roundTotal={rounds.length}
            duration={currentRound.duration}
        >
            {currentRound.type === 'mcq' && <MCQInterface onComplete={handleNextRound} />}
            {currentRound.type === 'dsa' && <DSAInterface onComplete={handleNextRound} />}
            {currentRound.type === 'ai' && <AIInterviewInterface onComplete={handleNextRound} />}
        </SecureShell>
    )
}
