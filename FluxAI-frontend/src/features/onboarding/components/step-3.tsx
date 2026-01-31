"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useOnboarding } from "@/features/onboarding/hooks/onboarding-context";

export function OnboardingStep3() {
    const router = useRouter();
    const { data, updateData } = useOnboarding();

    const [workspaceName, setWorkspaceName] = useState(data.workspaceName || data.companyName || "");

    const handleCreateWorkspace = () => {
        updateData({ workspaceName });
        // Redirect to dashboard
        router.push("/dashboard");
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
                        <Button onClick={handleBack} variant="outline" size="lg">
                            Back
                        </Button>
                        <p className="text-sm text-muted-foreground">Step 3 of 3</p>
                    </div>
                    <Button
                        onClick={handleCreateWorkspace}
                        disabled={!workspaceName.trim()}
                        size="lg"
                        className="min-w-40"
                    >
                        Create Workspace
                    </Button>
                </div>
            </div>
        </div>
    );
}
