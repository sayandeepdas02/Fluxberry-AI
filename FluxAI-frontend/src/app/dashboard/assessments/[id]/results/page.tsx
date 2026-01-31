"use client"

import { AssessmentResults } from "@/features/assessments/components/assessment-results"

export default function AssessmentResultsPage({ params }: { params: { id: string } }) {
    return <AssessmentResults assessmentId={params.id} />
}
