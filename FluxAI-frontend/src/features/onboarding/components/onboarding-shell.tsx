"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface StepDef {
    number: number;
    label: string;
    description: string;
}

const STEPS: StepDef[] = [
    { number: 1, label: "Your Profile", description: "Personal & company info" },
    { number: 2, label: "Hiring Stack", description: "Choose your modules" },
    { number: 3, label: "Workspace", description: "Create your workspace" },
];

interface OnboardingShellProps {
    currentStep: 1 | 2 | 3;
    children: React.ReactNode;
}

export function OnboardingShell({ currentStep, children }: OnboardingShellProps) {
    return (
        <div className="min-h-screen flex bg-background">

            {/* ── Main content area ── */}
            <div className="flex-1 flex flex-col min-w-0">

                {/* Mobile top bar */}
                <div className="lg:hidden flex items-center justify-between px-5 h-11 border-b border-line shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-primary flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-primary-foreground" />
                        </div>
                        <span className="text-xs font-semibold tracking-tight">Fluxberry AI</span>
                    </div>
                    {/* Mobile step bars */}
                    <div className="flex items-center gap-1">
                        {STEPS.map((step) => (
                            <div
                                key={step.number}
                                className={cn(
                                    "h-[3px] transition-all duration-300",
                                    step.number === currentStep
                                        ? "w-5 bg-primary"
                                        : step.number < currentStep
                                        ? "w-3 bg-primary/40"
                                        : "w-3 bg-muted-foreground/20"
                                )}
                            />
                        ))}
                    </div>
                </div>

                {/* Content center */}
                <div className="flex-1 flex items-center justify-center p-6 lg:p-12 xl:p-16">
                    <div className="w-full max-w-md">
                        {children}
                    </div>
                </div>
            </div>

            {/* ── Right stepper panel (desktop only) ── */}
            <aside className="hidden lg:flex w-60 xl:w-64 flex-col border-l border-line shrink-0 bg-muted/[0.03]">

                {/* Brand */}
                <div className="px-5 py-4 border-b border-line">
                    <div className="flex items-center gap-2.5">
                        <div className="w-5 h-5 bg-primary flex items-center justify-center">
                            <div className="w-2 h-2 bg-primary-foreground" />
                        </div>
                        <span className="text-sm font-semibold tracking-tight">Fluxberry AI</span>
                    </div>
                </div>

                {/* Steps */}
                <div className="flex-1 px-4 py-6 overflow-auto">
                    <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/50 px-2 mb-4">
                        Setup
                    </p>

                    <div className="relative">
                        {/* Vertical connector track */}
                        <div className="absolute left-[19px] top-5 bottom-5 w-px bg-line" />

                        <div className="space-y-0">
                            {STEPS.map((step) => {
                                const isCompleted = step.number < currentStep;
                                const isCurrent = step.number === currentStep;
                                const isUpcoming = step.number > currentStep;

                                return (
                                    <div
                                        key={step.number}
                                        className={cn(
                                            "flex items-start gap-3 px-2 py-3 transition-all duration-200",
                                            isCurrent && "bg-primary/[0.04]"
                                        )}
                                    >
                                        {/* Step indicator */}
                                        <div className="relative z-10 flex-shrink-0 mt-0.5">
                                            <div
                                                className={cn(
                                                    "w-4 h-4 border flex items-center justify-center transition-all duration-200",
                                                    isCompleted && "bg-primary border-primary",
                                                    isCurrent && "border-primary bg-background",
                                                    isUpcoming && "border-muted-foreground/25 bg-background"
                                                )}
                                            >
                                                {isCompleted && (
                                                    <Check className="w-2.5 h-2.5 text-primary-foreground" strokeWidth={3} />
                                                )}
                                                {isCurrent && (
                                                    <div className="w-1.5 h-1.5 bg-primary" />
                                                )}
                                            </div>
                                        </div>

                                        {/* Step text */}
                                        <div className="pt-0.5 min-w-0">
                                            <p
                                                className={cn(
                                                    "text-[13px] font-medium leading-none mb-1 transition-colors",
                                                    isUpcoming
                                                        ? "text-muted-foreground/60"
                                                        : "text-foreground"
                                                )}
                                            >
                                                {step.label}
                                            </p>
                                            <p className="text-[11px] text-muted-foreground/50 leading-snug">
                                                {step.description}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Panel footer */}
                <div className="px-5 py-4 border-t border-line">
                    <div className="space-y-0.5">
                        <p className="text-[11px] font-medium text-muted-foreground/60">
                            Step {currentStep} of {STEPS.length}
                        </p>
                        <div className="flex items-center gap-1 pt-1">
                            {STEPS.map((step) => (
                                <div
                                    key={step.number}
                                    className={cn(
                                        "h-0.5 transition-all duration-300",
                                        step.number <= currentStep
                                            ? "bg-primary"
                                            : "bg-muted-foreground/20",
                                        step.number === currentStep ? "flex-[2]" : "flex-1"
                                    )}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </aside>
        </div>
    );
}
