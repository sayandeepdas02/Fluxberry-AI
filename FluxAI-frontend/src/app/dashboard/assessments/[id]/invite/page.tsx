"use client"

import { InviteCandidates } from "@/features/assessments/components/invite-candidates"

export default function InviteCandidatesPage({ params }: { params: { id: string } }) {
    return <InviteCandidates assessmentId={params.id} />
}
