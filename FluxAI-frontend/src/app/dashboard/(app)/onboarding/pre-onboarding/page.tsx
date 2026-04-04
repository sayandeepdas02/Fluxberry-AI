"use client"

import { PageContainer } from "@/components/dashboard/page-container"
import { ATSOnboardingList } from "@/features/onboarding/components/ats-onboarding-list"

export default function PreOnboardingPage() {
    return (
        <PageContainer title="Pre-Onboarding" description="Prepare new hires with pre-onboarding tasks and documentation.">
            <div className="mt-6 w-full space-y-6">
                <ATSOnboardingList />
            </div>
        </PageContainer>
    )
}
