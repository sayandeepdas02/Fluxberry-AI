"use client"

import { use } from "react"
import { ConfigureAssessment } from "@/features/assessments/components/configure-assessment"

export default function ConfigureAssessmentPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    return <ConfigureAssessment assessmentId={id} />
}
