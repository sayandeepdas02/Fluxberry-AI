"use client";

import { OnboardingProvider } from "@/features/onboarding/hooks/onboarding-context";
import { ProtectedRoute } from "@/lib/context/protected-route";
import { ErrorBoundary } from "@/components/shared/error-boundary";

export default function OnboardingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ErrorBoundary section="Onboarding">
            <ProtectedRoute requireIncompleteOnboarding={true}>
                <OnboardingProvider>
                    {children}
                </OnboardingProvider>
            </ProtectedRoute>
        </ErrorBoundary>
    );
}
