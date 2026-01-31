"use client"

import { use } from "react"
import { RoundTransition } from "@/features/candidate/components/test-taker/round-transition"

export default function RoundTransitionPage({ params }: { params: Promise<{ assessmentId: string, nextRoundId: string }> }) {
    const { assessmentId, nextRoundId } = use(params)
    return <RoundTransition assessmentId={assessmentId} nextRoundId={nextRoundId} />
}
