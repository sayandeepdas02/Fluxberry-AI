"use client"

import { CandidatePoolView } from "@/features/candidate/components/candidate-pool-view"

export default function CandidatePoolPage() {
    return (
        <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 lg:px-8 py-8">
            <CandidatePoolView />
        </div>
    )
}
