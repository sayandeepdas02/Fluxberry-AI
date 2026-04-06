"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { SHINE_CLASSES } from "@/components/shared/layout-primitives";

const AI_CREDIT_BUNDLES = [
    { credits: 1000, price: 20 },
    { credits: 2500, price: 40 },
    { credits: 10000, price: 100 },
    { credits: 20000, price: 150 },
];

export function PricingAiCredits() {
    return (
        <section className="mb-32 px-4 max-w-5xl mx-auto">
            <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium mb-4 gap-2">
                    <Sparkles className="w-4 h-4" />
                    AI Credit Add-ons
                </div>
                <h2 className="text-3xl tracking-tight mb-4 text-foreground">
                    Top up as you grow
                </h2>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                    Need more candidate screenings and assessments? Add AI credits to your account anytime. Standard tests cost 1 credit.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {AI_CREDIT_BUNDLES.map((bundle, idx) => (
                    <div 
                        key={idx} 
                        className="flex flex-col items-center p-8 bg-background border border-border rounded-xl hover:border-foreground/30 transition-colors shadow-sm"
                    >
                        <div className="text-muted-foreground text-sm font-medium mb-2 uppercase tracking-wide">
                            {bundle.credits.toLocaleString()} Credits
                        </div>
                        <div className="text-4xl text-foreground tracking-tight mb-6 mt-2">
                            ${bundle.price}
                        </div>
                        <button className={cn(
                            "w-full py-2 bg-muted hover:bg-muted/80 text-foreground text-sm font-medium rounded-lg transition-colors border border-border",
                            SHINE_CLASSES
                        )}>
                            Add to Plan
                        </button>
                    </div>
                ))}
            </div>
        </section>
    );
}
