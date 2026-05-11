"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useOnboarding } from "@/features/onboarding/hooks/onboarding-context";
import { OnboardingShell } from "./onboarding-shell";

const ROLES = [
    "Founder / CEO",
    "Recruiter",
    "Hiring Manager",
    "Engineering Lead",
    "HR / People Ops",
    "Other",
];

export function OnboardingStep1() {
    const router = useRouter();
    const { data, updateData } = useOnboarding();

    const [formData, setFormData] = useState({
        fullName: data.fullName || "",
        companyName: data.companyName || "",
        companyWebsite: data.companyWebsite || "",
        role: data.role || "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleContinue = () => {
        updateData(formData);
        router.push("/onboard/step-2");
    };

    const isValid = formData.fullName.trim() && formData.companyName.trim() && formData.role;

    return (
        <OnboardingShell currentStep={1}>

            {/* Header */}
            <div className="mb-7">
                <h1 className="text-xl font-semibold tracking-tight mb-1.5">Welcome to Fluxberry</h1>
                <p className="text-sm text-muted-foreground leading-snug">
                    Let's get your account set up in a few quick steps.
                </p>
            </div>

            {/* Form */}
            <div className="space-y-5">

                <div className="space-y-1.5">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                        type="text"
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder="Jane Smith"
                        autoFocus
                    />
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                        type="text"
                        id="companyName"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleChange}
                        placeholder="Acme Corp"
                    />
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="companyWebsite">
                        Company Website{" "}
                        <span className="text-muted-foreground/60 font-normal text-xs">— optional</span>
                    </Label>
                    <Input
                        type="url"
                        id="companyWebsite"
                        name="companyWebsite"
                        value={formData.companyWebsite}
                        onChange={handleChange}
                        placeholder="https://acme.com"
                    />
                </div>

                {/* Role selection */}
                <div className="space-y-2">
                    <Label>Your Role</Label>
                    <div className="flex flex-wrap gap-1.5">
                        {ROLES.map((role) => (
                            <button
                                key={role}
                                type="button"
                                onClick={() => setFormData((p) => ({ ...p, role }))}
                                className={cn(
                                    "px-3 py-1.5 border text-xs font-medium transition-all duration-150 select-none",
                                    formData.role === role
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "bg-background text-foreground border-line hover:border-foreground/25 hover:bg-muted/50"
                                )}
                            >
                                {role}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-5 border-t border-line flex items-center justify-between">
                <span />

                <div className="flex items-center gap-1.5">
                    <div className="w-5 h-[3px] bg-primary" />
                    <div className="w-2 h-[3px] bg-muted-foreground/20" />
                    <div className="w-2 h-[3px] bg-muted-foreground/20" />
                </div>

                <Button
                    onClick={handleContinue}
                    disabled={!isValid}
                    size="sm"
                    className="px-5 font-medium"
                >
                    Continue
                </Button>
            </div>

        </OnboardingShell>
    );
}
