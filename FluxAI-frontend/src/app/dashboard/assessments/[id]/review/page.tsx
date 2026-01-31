"use client"

import { use } from "react"
import { AssessmentReview } from "@/features/assessments/components/assessment-review"

export default function AssessmentReviewPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    return <AssessmentReview assessmentId={id} />
}
