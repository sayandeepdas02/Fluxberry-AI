import { OnboardingProvider } from "@/features/onboarding/hooks/onboarding-context";

export default function OnboardingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <OnboardingProvider>
            {children}
        </OnboardingProvider>
    );
}
