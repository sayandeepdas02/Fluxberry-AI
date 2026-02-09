"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { SecureShell } from "./secure-shell"
import { MCQInterface } from "./mcq-interface"
import { DSAInterface } from "./dsa-interface"
import { AIInterviewInterface } from "./ai-interview-interface"
import { getAttemptId, getRoundTypes, setRoundTypes } from "@/features/candidate/lib/attempt-storage"
import { attemptsApi, RoundQuestionResponse } from "@/lib/api/attempts"
import { AttemptRound } from "@/lib/api/types"

const ROUND_TITLES: Record<string, string> = {
    MCQ: "Technical MCQ",
    DSA: "Hands-on Coding",
    AI: "AI Video Interview",
}

export function RoundRenderer({ assessmentId, roundId }: { assessmentId: string; roundId: string }) {
    const router = useRouter()
    const attemptId = getAttemptId(assessmentId)

    const [questions, setQuestions] = useState<RoundQuestionResponse[] | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Timer state
    const [startedAt, setStartedAt] = useState<string | null>(null)
    const [timeLimit, setTimeLimit] = useState<number | null>(null)

    // Round types - start with session storage value, fallback fetch if null
    const [roundTypes, setRoundTypesState] = useState<string[] | null>(() => getRoundTypes(assessmentId))

    const roundIndex = parseInt(roundId, 10)
    const roundType = roundTypes?.[roundIndex] ?? null

    useEffect(() => {
        if (!attemptId) {
            router.replace(`/assessment/${assessmentId}/start`)
            return
        }

        // If roundTypes is missing (e.g., after page refresh), fetch from API
        if (!roundTypes) {
            attemptsApi.getById(attemptId).then(res => {
                if (res.success && res.data && res.data.rounds.length > 0) {
                    const types = res.data.rounds.map((r: AttemptRound) => r.roundType)
                    setRoundTypes(assessmentId, types)
                    setRoundTypesState(types)
                } else {
                    // No attempt data, redirect to start
                    router.replace(`/assessment/${assessmentId}/start`)
                }
            }).catch(() => {
                router.replace(`/assessment/${assessmentId}/start`)
            })
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
                // 1. Start the round (idempotent)
                const startRes = await attemptsApi.startRound(attemptId!, roundType!)
                if (!startRes.success && startRes.error?.code !== "INVALID_STATUS") {
                    if (!cancelled) setError(startRes.error?.message ?? "Failed to start round")
                    return
                }

                // 2. Refresh attempt state to get time limits
                const attemptRes = await attemptsApi.getById(attemptId!)
                if (!attemptRes.success || !attemptRes.data) {
                    if (!cancelled) setError("Failed to load attempt details")
                    return
                }

                // Find current round attempt
                const currentRoundAttempt = attemptRes.data.rounds.find(
                    (r: AttemptRound) => r.roundType === roundType && r.status !== 'NOT_STARTED'
                )

                if (currentRoundAttempt) {
                    setStartedAt(currentRoundAttempt.startedAt)
                    setTimeLimit(currentRoundAttempt.timeLimit)
                }

                // 3. Get questions (snapshotted)
                const res = await attemptsApi.getRoundQuestions(attemptId!, roundType!)
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
            // Navigate to transition page between rounds (no auto-jump)
            router.push(`/assessment/${assessmentId}/transition/${roundIndex}`)
        } else {
            // Last round completed
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

    return (
        <SecureShell
            title={title}
            roundIndex={roundIndex + 1}
            roundTotal={roundTypes.length}
            startedAt={startedAt}
            timeLimit={timeLimit}
        >
            {roundType === "MCQ" && (
                <MCQInterface
                    attemptId={attemptId}
                    roundIndex={roundIndex}
                    questions={questions?.filter((q): q is import("@/lib/api/attempts").RoundQuestionMCQ => q.type === "MCQ") ?? []}
                    onRoundComplete={handleNextRound}
                />
            )}
            {roundType === "DSA" && (
                <DSAInterface
                    attemptId={attemptId}
                    roundIndex={roundIndex}
                    questions={questions?.filter((q): q is import("@/lib/api/attempts").RoundQuestionDSA => q.type === "DSA") ?? []}
                    onRoundComplete={handleNextRound}
                />
            )}
            {roundType === "AI" && (
                <AIInterviewInterface onComplete={() => handleAIComplete({})} />
            )}
        </SecureShell>
    )
}
