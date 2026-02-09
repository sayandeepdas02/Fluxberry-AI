"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { RoundTransition } from "@/features/candidate/components/test-taker/round-transition"
import { getAttemptId, getRoundTypes, setRoundTypes } from "@/features/candidate/lib/attempt-storage"
import { attemptsApi } from "@/lib/api/attempts"
import { AttemptRound } from "@/lib/api/types"

export default function RoundTransitionPage({ params }: { params: Promise<{ assessmentId: string, completedRoundIndex: string }> }) {
    const { assessmentId, completedRoundIndex } = use(params)
    const router = useRouter()

    const attemptId = getAttemptId(assessmentId)
    const completedIdx = parseInt(completedRoundIndex, 10)

    const [roundTypes, setRoundTypesState] = useState<string[] | null>(() => getRoundTypes(assessmentId))
    const [loading, setLoading] = useState(!roundTypes)

    useEffect(() => {
        if (!attemptId) {
            router.replace(`/assessment/${assessmentId}/start`)
            return
        }

        // Fetch round types if not available
        if (!roundTypes) {
            attemptsApi.getById(attemptId).then(res => {
                if (res.success && res.data && res.data.rounds.length > 0) {
                    const types = res.data.rounds.map((r: AttemptRound) => r.roundType)
                    setRoundTypes(assessmentId, types)
                    setRoundTypesState(types)
                } else {
                    router.replace(`/assessment/${assessmentId}/start`)
                }
            }).catch(() => {
                router.replace(`/assessment/${assessmentId}/start`)
            }).finally(() => {
                setLoading(false)
            })
        }
    }, [assessmentId, attemptId, roundTypes, router])

    if (loading || !roundTypes) {
        return (
            <div className="min-h-screen flex items-center justify-center text-neutral-500">
                Loading...
            </div>
        )
    }

    // Validate indices
    if (isNaN(completedIdx) || completedIdx < 0 || completedIdx >= roundTypes.length) {
        return (
            <div className="min-h-screen flex items-center justify-center text-red-500">
                Invalid round transition
            </div>
        )
    }

    const nextIdx = completedIdx + 1

    // If this was the last round, redirect to completed
    if (nextIdx >= roundTypes.length) {
        router.replace(`/assessment/${assessmentId}/completed`)
        return null
    }

    return (
        <RoundTransition
            assessmentId={assessmentId}
            completedRoundIndex={completedIdx}
            nextRoundIndex={nextIdx}
            completedRoundType={roundTypes[completedIdx]}
            nextRoundType={roundTypes[nextIdx]}
            totalRounds={roundTypes.length}
        />
    )
}
