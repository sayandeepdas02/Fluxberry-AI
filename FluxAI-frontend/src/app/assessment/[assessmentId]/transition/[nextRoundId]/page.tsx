"use client"

import { RoundTransition } from "@/features/candidate/components/test-taker/round-transition"

export default function RoundTransitionPage({ params }: { params: { assessmentId: string, nextRoundId: string } }) {
    return <RoundTransition assessmentId={params.assessmentId} nextRoundId={params.nextRoundId} />
}
