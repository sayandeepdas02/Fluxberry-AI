"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useOnboarding } from "@/features/onboarding/hooks/onboarding-context";
import { onboardingApi } from "@/lib/api/onboarding";
import { useAuth } from "@/lib/context/auth-context";

export function OnboardingStep3() {
    const router = useRouter();
    const { data, updateData } = useOnboarding();
    const { refreshUser } = useAuth();

    const [workspaceName, setWorkspaceName] = useState(data.workspaceName || data.companyName || "");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCreateWorkspace = async () => {
        if (!workspaceName.trim()) return;

        setIsLoading(true);
        setError(null);

        try {
            updateData({ workspaceName });

            // Call API to complete onboarding
            const response = await onboardingApi.complete({
                fullName: data.fullName,
                companyRole: data.role,
                companyWebsite: data.companyWebsite,
                productSelection: data.productSelection || undefined,
                workspaceName: workspaceName.trim(),
            });

            if (response.success) {
                // Refresh user data in auth context
                await refreshUser();
                // Redirect to dashboard
                router.push("/dashboard");
            } else {
                setError(response.error?.message || "Failed to complete onboarding");
            }
        } catch (err) {
            console.error("Onboarding error:", err);
            setError("An error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleBack = () => {
        router.push("/onboard/step-2");
    };

    // Generate initials from workspace name
    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((word) => word[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-4xl font-bold mb-3">Create your workspace</h1>
                    <p className="text-lg text-muted-foreground">
                        This is where all your hiring activity will live.
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                        {error}
                    </div>
                )}

                {/* Workspace Card */}
                <div className="border border-border rounded-lg p-8 mb-12 bg-muted/20">
                    <div className="flex items-start gap-6">
                        {/* Logo Placeholder */}
                        <div className="flex-shrink-0">
                            <div
                                className={cn(
                                    "w-20 h-20 rounded-lg flex items-center justify-center",
                                    "bg-foreground text-background text-2xl font-bold"
                                )}
                            >
                                {workspaceName ? getInitials(workspaceName) : "?"}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2 text-center">
                                Auto-generated
                            </p>
                        </div>

                        {/* Workspace Name Input */}
                        <div className="flex-1">
                            <label htmlFor="workspaceName" className="block text-sm font-medium mb-2">
                                Workspace Name
                            </label>
                            <input
                                type="text"
                                id="workspaceName"
                                name="workspaceName"
                                value={workspaceName}
                                onChange={(e) => setWorkspaceName(e.target.value)}
                                className={cn(
                                    "w-full px-4 py-2.5 border rounded-md text-sm",
                                    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                                    "transition-colors border-border hover:border-foreground/50"
                                )}
                                placeholder="Acme Corp"
                                disabled={isLoading}
                            />
                            <p className="text-xs text-muted-foreground mt-2">
                                Usually your company or team name
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button onClick={handleBack} variant="outline" size="lg" disabled={isLoading}>
                            Back
                        </Button>
                        <p className="text-sm text-muted-foreground">Step 3 of 3</p>
                    </div>
                    <Button
                        onClick={handleCreateWorkspace}
                        disabled={!workspaceName.trim() || isLoading}
                        size="lg"
                        className="min-w-40"
                    >
                        {isLoading ? "Creating..." : "Create Workspace"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
