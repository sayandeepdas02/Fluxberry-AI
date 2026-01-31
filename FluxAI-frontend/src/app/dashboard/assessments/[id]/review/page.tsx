"use client"

import { AssessmentReview } from "@/features/assessments/components/assessment-review"

export default function AssessmentReviewPage({ params }: { params: { id: string } }) {
    return <AssessmentReview assessmentId={params.id} />
}
