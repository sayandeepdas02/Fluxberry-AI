"use client"

import { use } from "react"
import { RoundRenderer } from "@/features/candidate/components/test-taker/round-renderer"

export default function AssessmentRoundPage({ params }: { params: Promise<{ assessmentId: string, roundId: string }> }) {
    const { assessmentId, roundId } = use(params)
    return <RoundRenderer assessmentId={assessmentId} roundId={roundId} />
}
