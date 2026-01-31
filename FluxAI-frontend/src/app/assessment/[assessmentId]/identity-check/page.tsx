"use client"

import { use } from "react"
import { IdentityCheckStep } from "@/features/candidate/components/test-taker/identity-check-step"

export default function IdentityCheckPage({ params }: { params: Promise<{ assessmentId: string }> }) {
    const { assessmentId } = use(params)
    return <IdentityCheckStep assessmentId={assessmentId} />
}
