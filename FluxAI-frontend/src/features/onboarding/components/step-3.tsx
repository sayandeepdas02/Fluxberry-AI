"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
                productSelection: 'both', // Legacy compatcast for backend strictly expecting 'ats' | 'hire' | 'both'
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
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <div className="w-full max-w-xl border border-line p-8 md:p-12">
                {/* Header */}
                <div className="mb-10 pb-8 border-b border-line">
                    <h1 className="text-3xl font-semibold mb-2 tracking-tight">Create your workspace</h1>
                    <p className="text-muted-foreground">
                        This is where all your hiring activity will live.
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                        {error}
                    </div>
                )}

                {/* Workspace Card */}
                <div className="border border-line p-8 mb-8 bg-muted/20">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                        {/* Logo Placeholder */}
                        <div className="flex-shrink-0">
                            <div
                                className={cn(
                                    "w-20 h-20 flex items-center justify-center",
                                    "bg-foreground text-background text-2xl font-semibold tracking-tighter"
                                )}
                            >
                                {workspaceName ? getInitials(workspaceName) : "?"}
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-2 text-center uppercase tracking-widest">
                                System
                            </p>
                        </div>

                        {/* Workspace Name Input */}
                        <div className="flex-1 w-full space-y-3">
                            <Label htmlFor="workspaceName">Workspace Name</Label>
                            <Input
                                id="workspaceName"
                                name="workspaceName"
                                value={workspaceName}
                                onChange={(e) => setWorkspaceName(e.target.value)}
                                placeholder="Acme Corp"
                                disabled={isLoading}
                            />
                            <p className="text-xs text-muted-foreground">
                                Usually your company or team name
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-12 pt-8 border-t border-line flex items-center justify-between">
                    <Button onClick={handleBack} variant="outline" className="px-6" disabled={isLoading}>
                        Back
                    </Button>
                    
                    <div className="flex items-center gap-6">
                        <p className="text-xs text-muted-foreground uppercase tracking-widest">Step 3 of 3</p>
                        <Button
                            onClick={handleCreateWorkspace}
                            disabled={!workspaceName.trim() || isLoading}
                            className="px-8 min-w-[160px]"
                        >
                            {isLoading ? "Creating..." : "Create Workspace"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
