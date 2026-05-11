"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useOnboarding } from "@/features/onboarding/hooks/onboarding-context";
import { Check } from "lucide-react";
import { OnboardingShell } from "./onboarding-shell";

const OS_APPS = [
    {
        id: "job_board",
        title: "Job Board",
        description: "Publish and manage career listings.",
        type: "core",
        defaultEnabled: true,
        locked: true,
    },
    {
        id: "ats_screening",
        title: "ATS Pipeline",
        description: "Move candidates through structured hiring stages.",
        type: "core",
        defaultEnabled: true,
        locked: true,
    },
    {
        id: "interview_agent",
        title: "Interview Automation",
        description: "AI voice screening and async coding assessments.",
        type: "add_on",
        defaultEnabled: true,
        pricingText: "Pay per usage",
        badge: "Popular",
    },
    {
        id: "talent_prospect",
        title: "Talent Prospect",
        description: "Global AI-powered candidate sourcing engine.",
        type: "add_on",
        defaultEnabled: false,
        pricingText: "Credit based",
        badge: "For Startups",
    },
];

export function OnboardingStep2() {
    const router = useRouter();
    const { data, updateData } = useOnboarding();

    const initialSelection = data.productSelection
        ? data.productSelection.split(",")
        : OS_APPS.filter((a) => a.defaultEnabled).map((a) => a.id);

    const [selectedApps, setSelectedApps] = useState<string[]>(initialSelection);

    const toggleApp = (id: string, locked?: boolean) => {
        if (locked) return;
        setSelectedApps((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const handleContinue = () => {
        updateData({ productSelection: selectedApps.join(",") });
        router.push("/onboard/step-3");
    };

    const handleBack = () => {
        router.push("/onboard/step-1");
    };

    return (
        <OnboardingShell currentStep={2}>

            {/* Header */}
            <div className="mb-6">
                <h1 className="text-xl font-semibold tracking-tight mb-1.5">Choose your hiring stack</h1>
                <p className="text-sm text-muted-foreground leading-snug">
                    Select the modules you need. Adjust anytime in the App Store.
                </p>
            </div>

            {/* Module list */}
            <div className="space-y-2 mb-5">
                {OS_APPS.map((app) => {
                    const isSelected = selectedApps.includes(app.id);

                    return (
                        <button
                            key={app.id}
                            onClick={() => toggleApp(app.id, app.locked)}
                            className={cn(
                                "w-full text-left px-4 py-3 border transition-all duration-150 flex items-center gap-3 group",
                                isSelected
                                    ? "border-primary/30 bg-primary/5"
                                    : "border-line bg-background",
                                !app.locked && "hover:border-foreground/20 hover:bg-muted/40",
                                app.locked && "cursor-default"
                            )}
                        >
                            {/* Square checkbox */}
                            <div
                                className={cn(
                                    "flex-shrink-0 w-4 h-4 border flex items-center justify-center transition-all duration-150",
                                    isSelected
                                        ? "bg-primary border-primary"
                                        : "border-muted-foreground/25 bg-transparent group-hover:border-foreground/35"
                                )}
                            >
                                {isSelected && (
                                    <Check className="w-2.5 h-2.5 text-primary-foreground" strokeWidth={3} />
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-medium text-foreground leading-none">
                                        {app.title}
                                    </span>
                                    {app.locked && (
                                        <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 leading-none">
                                            Required
                                        </span>
                                    )}
                                    {app.badge && (
                                        <span className="text-[10px] font-medium text-primary/75 bg-primary/10 px-1.5 py-0.5 leading-none">
                                            {app.badge}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 leading-snug">
                                    {app.description}
                                </p>
                            </div>

                            {/* Pricing */}
                            {app.pricingText && (
                                <span className="flex-shrink-0 text-xs text-muted-foreground/60">
                                    {app.pricingText}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Trial note */}
            <p className="text-xs text-muted-foreground/60">
                All modules are free for 14 days — no credit card required.
            </p>

            {/* Footer */}
            <div className="mt-8 pt-5 border-t border-line flex items-center justify-between">
                <button
                    onClick={handleBack}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-150"
                >
                    ← Back
                </button>

                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-[3px] bg-primary/40" />
                    <div className="w-5 h-[3px] bg-primary" />
                    <div className="w-2 h-[3px] bg-muted-foreground/20" />
                </div>

                <Button
                    onClick={handleContinue}
                    disabled={selectedApps.length === 0}
                    size="sm"
                    className="px-5 font-medium"
                >
                    Continue
                </Button>
            </div>

        </OnboardingShell>
    );
}
