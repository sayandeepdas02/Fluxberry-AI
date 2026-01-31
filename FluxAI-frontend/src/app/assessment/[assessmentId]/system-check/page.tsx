"use client"

import { use } from "react"
import { SystemCheckStep } from "@/features/candidate/components/test-taker/system-check-step"

export default function SystemCheckPage({ params }: { params: Promise<{ assessmentId: string }> }) {
    const { assessmentId } = use(params)
    return <SystemCheckStep assessmentId={assessmentId} />
}
