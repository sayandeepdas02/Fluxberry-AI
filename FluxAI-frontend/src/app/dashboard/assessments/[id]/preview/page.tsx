"use client"

import { use } from "react"
import { AssessmentPreview } from "@/features/assessments/components/assessment-preview"

export default function AssessmentPreviewPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    return <AssessmentPreview assessmentId={id} />
}
