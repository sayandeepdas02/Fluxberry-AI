"use client"

import { StartStep } from "@/features/candidate/components/test-taker/start-step"

export default function AssessmentStartPage({ params }: { params: { assessmentId: string } }) {
    return <StartStep assessmentId={params.assessmentId} />
}
