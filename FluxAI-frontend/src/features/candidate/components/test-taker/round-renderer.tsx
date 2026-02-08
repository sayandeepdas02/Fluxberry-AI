"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { SecureShell } from "./secure-shell"
import { MCQInterface } from "./mcq-interface"
import { DSAInterface } from "./dsa-interface"
import { AIInterviewInterface } from "./ai-interview-interface"
import { getAttemptId, getRoundTypes } from "@/features/candidate/lib/attempt-storage"
import { attemptsApi, RoundQuestionResponse } from "@/lib/api/attempts"

const ROUND_TITLES: Record<string, string> = {
    MCQ: "Technical MCQ",
    DSA: "Hands-on Coding",
    AI: "AI Video Interview",
}

const ROUND_DURATIONS: Record<string, string> = {
    MCQ: "45:00",
    DSA: "60:00",
    AI: "15:00",
}

export function RoundRenderer({ assessmentId, roundId }: { assessmentId: string; roundId: string }) {
    const router = useRouter()
    const attemptId = getAttemptId(assessmentId)
    const roundTypes = getRoundTypes(assessmentId)

    const [questions, setQuestions] = useState<RoundQuestionResponse[] | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const roundIndex = parseInt(roundId, 10)
    const roundType = roundTypes?.[roundIndex] ?? null

    useEffect(() => {
        if (!attemptId || !roundTypes) {
            router.replace(`/assessment/${assessmentId}/start`)
            return
        }
        if (roundIndex < 0 || roundIndex >= roundTypes.length || !roundType) {
            setLoading(false)
            setError("Invalid round")
            return
        }

        let cancelled = false
        async function init() {
            try {
                const startRes = await attemptsApi.startRound(attemptId, roundType)
                if (!startRes.success && startRes.error?.code !== "INVALID_STATUS") {
                    if (!cancelled) setError(startRes.error?.message ?? "Failed to start round")
                    return
                }
                const res = await attemptsApi.getRoundQuestions(attemptId, roundType)
                if (cancelled) return
                if (res.success && res.data) setQuestions(res.data)
                else setQuestions([])
            } catch {
                if (!cancelled) setError("Failed to load round")
            } finally {
                if (!cancelled) setLoading(false)
            }
        }
        init()
        return () => { cancelled = true }
    }, [assessmentId, attemptId, roundId, roundIndex, roundType, roundTypes, router])

    const handleNextRound = () => {
        if (roundIndex < (roundTypes?.length ?? 0) - 1) {
            router.push(`/assessment/${assessmentId}/round/${roundIndex + 1}`)
        } else {
            router.push(`/assessment/${assessmentId}/completed`)
        }
    }

    const handleMCQComplete = async (answers: Record<string, number[]>) => {
        if (!attemptId || !roundType) return
        try {
            const res = await attemptsApi.submitRound(attemptId, roundType, { answers })
            if (res.success) handleNextRound()
            else setError(res.error?.message ?? "Submit failed")
        } catch {
            setError("Submit failed")
        }
    }

    const handleDSAComplete = async (answers: Record<string, unknown>) => {
        if (!attemptId || !roundType) return
        try {
            const res = await attemptsApi.submitRound(attemptId, roundType, { answers })
            if (res.success) handleNextRound()
            else setError(res.error?.message ?? "Submit failed")
        } catch {
            setError("Submit failed")
        }
    }

    const handleAIComplete = async (answers: Record<string, unknown>) => {
        if (!attemptId || !roundType) return
        try {
            const res = await attemptsApi.submitRound(attemptId, roundType, { answers })
            if (res.success) handleNextRound()
            else setError(res.error?.message ?? "Submit failed")
        } catch {
            setError("Submit failed")
        }
    }

    if (!attemptId || !roundTypes) return null
    if (error || roundType === null) {
        return (
            <div className="p-10 text-center">
                <p className="text-red-600">{error ?? "Invalid round"}</p>
            </div>
        )
    }
    if (loading) {
        return (
            <div className="p-10 text-center text-neutral-500">
                Loading round…
            </div>
        )
    }

    const title = ROUND_TITLES[roundType] ?? roundType
    const duration = ROUND_DURATIONS[roundType] ?? "00:00"

    return (
        <SecureShell
            title={title}
            roundIndex={roundIndex + 1}
            roundTotal={roundTypes.length}
            duration={duration}
        >
            {roundType === "MCQ" && (
                <MCQInterface
                    questions={questions?.filter((q): q is import("@/lib/api/attempts").RoundQuestionMCQ => q.type === "MCQ") ?? []}
                    onComplete={handleMCQComplete}
                />
            )}
            {roundType === "DSA" && (
                <DSAInterface
                    questions={questions?.filter((q): q is import("@/lib/api/attempts").RoundQuestionDSA => q.type === "DSA") ?? []}
                    onComplete={handleDSAComplete}
                />
            )}
            {roundType === "AI" && (
                <AIInterviewInterface onComplete={() => handleAIComplete({})} />
            )}
        </SecureShell>
    )
}
