"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useOnboarding } from "@/features/onboarding/hooks/onboarding-context";
import { Clock, CheckSquare, Square, Zap } from "lucide-react";

// Represents the OS Modular Stack presented at onboarding
const OS_APPS = [
    {
        id: "job_board",
        title: "Job Board",
        description: "Publish career listings.",
        type: "core",
        defaultEnabled: true,
        locked: true // Core modules cannot be disabled
    },
    {
        id: "ats_screening",
        title: "ATS Pipeline",
        description: "Manage candidates across stages.",
        type: "core",
        defaultEnabled: true,
        locked: true
    },
    {
        id: "interview_agent",
        title: "Interview Automation",
        description: "AI voice screening & coding tests.",
        type: "add_on",
        defaultEnabled: true, // Recommended
        pricingText: "Pay per usage",
        badge: "Recommended for Scaling Teams"
    },
    {
        id: "talent_prospect",
        title: "Talent Prospect",
        description: "Global AI sourcing search engine.",
        type: "add_on",
        defaultEnabled: false,
        pricingText: "Credit based",
        badge: "Recommended for Startups"
    }
];

export function OnboardingStep2() {
    const router = useRouter();
    const { data, updateData } = useOnboarding();

    // Because the old system only allowed "ats" or "hire", we will serialize our modular selection 
    // into a unified comma separated string or override the context in Step 3.
    // For now we manage local array state.
    const initialSelection = data.productSelection 
        ? data.productSelection.split(',') 
        : OS_APPS.filter(a => a.defaultEnabled).map(a => a.id);

    const [selectedApps, setSelectedApps] = useState<string[]>(initialSelection);

    const toggleApp = (id: string, locked?: boolean) => {
        if (locked) return; // Cannot toggle core apps
        
        setSelectedApps(prev => 
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleContinue = () => {
        // We inject the selection into the old tracking field
        updateData({ productSelection: selectedApps.join(',') });
        router.push("/onboard/step-3");
    };

    const handleBack = () => {
        router.push("/onboard/step-1");
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <div className="w-full max-w-2xl border border-line p-8 md:p-12">
                
                {/* Header */}
                <div className="mb-8 border-b border-line pb-6">
                    <h1 className="text-3xl font-semibold mb-2 tracking-tight">Choose your hiring stack</h1>
                    <p className="text-muted-foreground text-sm">
                        Select the modules you need. Don't worry, you can always change this later in the App Store.
                    </p>
                    
                    <div className="mt-4 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-semibold text-xs rounded-none flex items-center justify-center gap-2 max-w-fit">
                        <Clock className="w-4 h-4" />
                        All features are completely free for 14 days
                    </div>
                </div>

                {/* Sub UI List */}
                <div className="space-y-3 mb-4">
                    {OS_APPS.map((app) => {
                        const isSelected = selectedApps.includes(app.id);
                        
                        return (
                            <button
                                key={app.id}
                                onClick={() => toggleApp(app.id, app.locked)}
                                className={cn(
                                    "w-full text-left p-4 border transition-colors relative flex items-start gap-4 hover:border-foreground/30",
                                    isSelected ? "border-primary bg-primary/5" : "border-line bg-background",
                                    app.locked && "opacity-90 cursor-default hover:border-primary"
                                )}
                            >
                                <div className="mt-1">
                                    {isSelected ? (
                                        <CheckSquare className="w-5 h-5 text-primary" />
                                    ) : (
                                        <Square className="w-5 h-5 text-muted-foreground" />
                                    )}
                                </div>
                                
                                <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                        <h3 className="font-semibold text-foreground">{app.title}</h3>
                                        {app.locked && (
                                            <span className="text-[10px] uppercase font-bold text-muted-foreground bg-muted px-2 py-0.5 tracking-wider">
                                                Core Required
                                            </span>
                                        )}
                                        {app.badge && (
                                            <span className="text-[10px] uppercase font-bold text-amber-600 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 tracking-wider flex items-center gap-1">
                                                <Zap className="w-3 h-3" />
                                                {app.badge}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {app.description}
                                    </p>
                                </div>

                                {app.pricingText && (
                                    <div className="text-xs font-semibold text-primary pt-1">
                                        {app.pricingText}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="mt-10 pt-6 border-t border-line flex items-center justify-between">
                    <Button onClick={handleBack} variant="outline" className="px-6 rounded-none">
                        Back
                    </Button>
                    
                    <div className="flex items-center gap-6">
                        <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest">Step 2 of 3</p>
                        <Button
                            onClick={handleContinue}
                            disabled={selectedApps.length === 0}
                            className="px-8 rounded-none font-semibold"
                        >
                            Continue Setup
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
