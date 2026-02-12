'use client'

import { ATSOnboardingList } from "@/features/onboarding/components/ats-onboarding-list";

export default function ActiveOnboardingPage() {
    return (
        <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 lg:px-8 py-8">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-foreground">Active Onboarding</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Track and manage onboarding progress for new hires.
                        </p>
                    </div>
                </div>

                {/* Content */}
                <ATSOnboardingList />
            </div>
        </div>
    );
}
