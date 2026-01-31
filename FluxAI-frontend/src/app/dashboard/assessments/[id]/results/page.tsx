"use client"

import { use } from "react"
import { AssessmentResults } from "@/features/assessments/components/assessment-results"

export default function AssessmentResultsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    return <AssessmentResults assessmentId={id} />
}
