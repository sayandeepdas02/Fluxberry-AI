"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-4xl font-bold mb-3">Welcome to FluxAI</h1>
                    <p className="text-lg text-muted-foreground">
                        Let's get your account set up in a few steps.
                    </p>
                </div>

                {/* Form */}
                <div className="space-y-6">
                    {/* Full Name */}
                    <div>
                        <label htmlFor="fullName" className="block text-sm font-medium mb-2">
                            Full Name
                        </label>
                        <input
                            type="text"
                            id="fullName"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            className={cn(
                                "w-full px-4 py-2.5 border rounded-md text-sm",
                                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                                "transition-colors border-border hover:border-foreground/50"
                            )}
                            placeholder="John Doe"
                        />
                    </div>

                    {/* Company Name */}
                    <div>
                        <label htmlFor="companyName" className="block text-sm font-medium mb-2">
                            Company Name
                        </label>
                        <input
                            type="text"
                            id="companyName"
                            name="companyName"
                            value={formData.companyName}
                            onChange={handleChange}
                            className={cn(
                                "w-full px-4 py-2.5 border rounded-md text-sm",
                                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                                "transition-colors border-border hover:border-foreground/50"
                            )}
                            placeholder="Acme Corp"
                        />
                    </div>

                    {/* Company Website */}
                    <div>
                        <label htmlFor="companyWebsite" className="block text-sm font-medium mb-2">
                            Company Website / URL{" "}
                            <span className="text-muted-foreground font-normal">(optional)</span>
                        </label>
                        <input
                            type="url"
                            id="companyWebsite"
                            name="companyWebsite"
                            value={formData.companyWebsite}
                            onChange={handleChange}
                            className={cn(
                                "w-full px-4 py-2.5 border rounded-md text-sm",
                                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                                "transition-colors border-border hover:border-foreground/50"
                            )}
                            placeholder="https://acme.com"
                        />
                    </div>

                    {/* Role Selection */}
                    <div>
                        <label className="block text-sm font-medium mb-3">Role</label>
                        <div className="flex flex-wrap gap-2">
                            {roles.map((role) => (
                                <button
                                    key={role}
                                    type="button"
                                    onClick={() => handleRoleSelect(role)}
                                    className={cn(
                                        "px-4 py-2 rounded-full text-sm font-medium transition-all",
                                        "border",
                                        formData.role === role
                                            ? "bg-foreground text-background border-foreground"
                                            : "bg-background text-foreground border-border hover:border-foreground/50"
                                    )}
                                >
                                    {role}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-12 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Step 1 of 3</p>
                    <Button
                        onClick={handleContinue}
                        disabled={!isValid}
                        size="lg"
                        className="min-w-32"
                    >
                        Continue
                    </Button>
                </div>
            </div>
        </div>
    );
}
