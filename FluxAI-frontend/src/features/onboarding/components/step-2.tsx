"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useOnboarding } from "@/features/onboarding/hooks/onboarding-context";

const products = [
    {
        id: "ats" as const,
        title: "Flux ATS",
        description:
            "Manage job posts, applications, resume screening, and candidate pipelines.",
    },
    {
        id: "hire" as const,
        title: "Flux Hire",
        description:
            "Run structured hiring workflows, interviews, and AI-assisted evaluations.",
    },
];

export function OnboardingStep2() {
    const router = useRouter();
    const { data, updateData } = useOnboarding();

    const [selectedProduct, setSelectedProduct] = useState<"ats" | "hire" | "">(
        data.productSelection || ""
    );

    const handleContinue = () => {
        updateData({ productSelection: selectedProduct });
        router.push("/onboard/step-3");
    };

    const handleBack = () => {
        router.push("/onboard/step-1");
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-4xl font-bold mb-3">How do you want to use Fluxberry AI?</h1>
                    <p className="text-lg text-muted-foreground">
                        This helps us tailor your experience.
                    </p>
                </div>

                {/* Product Cards */}
                <div className="grid gap-4 mb-12">
                    {products.map((product) => (
                        <button
                            key={product.id}
                            onClick={() => setSelectedProduct(product.id)}
                            className={cn(
                                "text-left p-6 rounded-lg border-2 transition-all",
                                "hover:border-foreground/50",
                                selectedProduct === product.id
                                    ? "border-foreground bg-muted/30"
                                    : "border-border bg-background"
                            )}
                        >
                            <h3 className="text-xl font-semibold mb-2">{product.title}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {product.description}
                            </p>
                        </button>
                    ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button onClick={handleBack} variant="outline" size="lg">
                            Back
                        </Button>
                        <p className="text-sm text-muted-foreground">Step 2 of 3</p>
                    </div>
                    <Button
                        onClick={handleContinue}
                        disabled={!selectedProduct}
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
