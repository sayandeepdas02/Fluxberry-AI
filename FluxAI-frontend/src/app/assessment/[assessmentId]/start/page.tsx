"use client"

import { use } from "react"
import { StartStep } from "@/features/candidate/components/test-taker/start-step"

export default function AssessmentStartPage({ params }: { params: Promise<{ assessmentId: string }> }) {
    const { assessmentId } = use(params)
    return <StartStep assessmentId={assessmentId} />
}
