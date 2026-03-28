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
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <div className="w-full max-w-xl border border-line p-8 md:p-12">
                {/* Header */}
                <div className="mb-10 pb-8 border-b border-line">
                    <h1 className="text-3xl font-semibold mb-2 tracking-tight">How do you want to use Fluxberry?</h1>
                    <p className="text-muted-foreground">
                        This helps us tailor your experience.
                    </p>
                </div>

                {/* Product Cards */}
                <div className="grid gap-4 mb-4">
                    {products.map((product) => (
                        <button
                            key={product.id}
                            onClick={() => setSelectedProduct(product.id)}
                            className={cn(
                                "text-left p-6 border transition-colors relative",
                                selectedProduct === product.id
                                    ? "border-primary bg-primary/5"
                                    : "border-line bg-background hover:bg-muted/50"
                            )}
                        >
                            <h3 className="text-lg font-semibold mb-1 text-foreground tracking-tight">{product.title}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed pr-8">
                                {product.description}
                            </p>
                            
                            <div className={cn(
                                "absolute top-6 right-6 w-5 h-5 border rounded-full flex items-center justify-center",
                                selectedProduct === product.id ? "border-primary bg-primary" : "border-line"
                            )}>
                                {selectedProduct === product.id && (
                                    <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                                )}
                            </div>
                        </button>
                    ))}
                </div>

                {/* Footer */}
                <div className="mt-12 pt-8 border-t border-line flex items-center justify-between">
                    <Button onClick={handleBack} variant="outline" className="px-6">
                        Back
                    </Button>
                    
                    <div className="flex items-center gap-6">
                        <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest">Step 2 of 3</p>
                        <Button
                            onClick={handleContinue}
                            disabled={!selectedProduct}
                            className="px-8"
                        >
                            Continue
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
