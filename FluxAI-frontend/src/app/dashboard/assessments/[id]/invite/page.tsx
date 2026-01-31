"use client"

import { use } from "react"
import { InviteCandidates } from "@/features/assessments/components/invite-candidates"

export default function InviteCandidatesPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    return <InviteCandidates assessmentId={id} />
}
