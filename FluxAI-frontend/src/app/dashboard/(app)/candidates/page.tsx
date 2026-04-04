"use client"

import { PageContainer } from "@/components/dashboard/page-container"
import { CandidatesTable } from "@/components/dashboard/candidates/candidates-table"
import { CandidateDrawer } from "@/components/dashboard/candidates/candidate-drawer"

export default function CandidatesPage() {
    return (
        <PageContainer
            title="Candidates"
            description="Manage your CRM: track source, stage, score, and overall pipeline."
        >
            <div className="w-full flex mt-6">
                <CandidatesTable />
            </div>

            <CandidateDrawer />
        </PageContainer>
    )
}
