"use client"

import { PageContainer } from "@/components/dashboard/page-container"
import { ATSOnboardingList } from "@/features/onboarding/components/ats-onboarding-list"

export default function JoiningPipelinePage() {
    return (
        <PageContainer title="Joining Pipeline" description="Track new hires through the joining and onboarding process.">
            <div className="mt-6 w-full space-y-6">
                <ATSOnboardingList />
            </div>
        </PageContainer>
    )
}
