"use client"

import { AssessmentPreview } from "@/features/assessments/components/assessment-preview"

export default function AssessmentPreviewPage({ params }: { params: { id: string } }) {
    return <AssessmentPreview assessmentId={params.id} />
}
