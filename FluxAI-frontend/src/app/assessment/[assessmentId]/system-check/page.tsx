"use client"

import { SystemCheckStep } from "@/features/candidate/components/test-taker/system-check-step"

export default function SystemCheckPage({ params }: { params: { assessmentId: string } }) {
    return <SystemCheckStep assessmentId={params.assessmentId} />
}
