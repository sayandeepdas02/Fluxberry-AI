"use client";

import { OnboardingProvider } from "@/features/onboarding/hooks/onboarding-context";
import { ProtectedRoute } from "@/lib/context/protected-route";

export default function OnboardingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ProtectedRoute requireIncompleteOnboarding={true}>
            <OnboardingProvider>
                {children}
            </OnboardingProvider>
        </ProtectedRoute>
    );
}
