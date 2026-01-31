"use client"

import { RoundRenderer } from "@/features/candidate/components/test-taker/round-renderer"

export default function AssessmentRoundPage({ params }: { params: { assessmentId: string, roundId: string } }) {
    return <RoundRenderer assessmentId={params.assessmentId} roundId={params.roundId} />
}
