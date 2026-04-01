"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useOnboarding } from "@/features/onboarding/hooks/onboarding-context";

const roles = [
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

    const handleRoleSelect = (role: string) => {
        setFormData((prev) => ({ ...prev, role }));
    };

    const handleContinue = () => {
        updateData(formData);
        router.push("/onboard/step-2");
    };

    const isValid = formData.fullName.trim() && formData.companyName.trim() && formData.role;

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <div className="w-full max-w-xl border border-line p-8 md:p-12">
                {/* Header */}
                <div className="mb-10 pb-8 border-b border-line">
                    <h1 className="text-3xl font-semibold mb-2 tracking-tight">Welcome to Fluxberry</h1>
                    <p className="text-muted-foreground">
                        Let's get your account set up in a few steps.
                    </p>
                </div>

                {/* Form */}
                <div className="space-y-6">
                    {/* Full Name */}
                    <div className="space-y-3">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                            type="text"
                            id="fullName"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            placeholder="John Doe"
                        />
                    </div>

                    {/* Company Name */}
                    <div className="space-y-3">
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

                    {/* Company Website */}
                    <div className="space-y-3">
                        <Label htmlFor="companyWebsite">
                            Company Website <span className="text-muted-foreground font-normal">(optional)</span>
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

                    {/* Role Selection */}
                    <div className="space-y-3 pt-2">
                        <Label>Role</Label>
                        <div className="flex flex-wrap gap-2">
                            {roles.map((role) => (
                                <button
                                    key={role}
                                    type="button"
                                    onClick={() => handleRoleSelect(role)}
                                    className={cn(
                                        "px-4 py-2 border text-sm font-medium transition-colors select-none",
                                        formData.role === role
                                            ? "bg-primary text-primary-foreground border-primary"
                                            : "bg-background text-foreground border-line hover:bg-muted"
                                    )}
                                >
                                    {role}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-12 pt-8 border-t border-line flex items-center justify-between">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest">Step 1 of 3</p>
                    <Button
                        onClick={handleContinue}
                        disabled={!isValid}
                        className="px-8"
                    >
                        Continue
                    </Button>
                </div>
            </div>
        </div>
    );
}
