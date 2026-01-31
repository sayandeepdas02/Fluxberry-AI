"use client"

import { IdentityCheckStep } from "@/features/candidate/components/test-taker/identity-check-step"

export default function IdentityCheckPage({ params }: { params: { assessmentId: string } }) {
    return <IdentityCheckStep assessmentId={params.assessmentId} />
}
