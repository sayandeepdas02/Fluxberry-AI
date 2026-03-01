"use client";

import { useState } from "react";
import { Check, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PricingTiers() {
    const [isYearly, setIsYearly] = useState(false);

    const tiers = [
        {
            name: "Starter",
            description: "Build your hiring engine with ATS + job board.",
            monthlyPrice: "$149",
            yearlyPrice: "$129",
            cta: "Get Started",
            highlighted: false,
            features: [
                "Unlimited Job Posts & Pipelines",
                "Up to 5,000 Candidate Storage",
                "Standard Careers Page",
                "Basic Role-Based Access Controls"
            ],
            aiTag: "Credit-based AI usage"
        },
        {
            name: "Growth",
            description: "Scale structured hiring with onboarding + automation.",
            monthlyPrice: "$399",
            yearlyPrice: "$329",
            cta: "Start Free Trial",
            highlighted: true,
            features: [
                "Everything in Starter",
                "Advanced Hiring & Compliance Workflows",
                "Offer Letter & Document Automation",
                "Slack & WhatsApp Integration",
                "Up to 25,000 Candidate Storage"
            ],
            aiTag: "Credit-based AI usage"
        },
        {
            name: "Enterprise",
            description: "High-volume AI hiring infrastructure with compliance & advanced analytics.",
            monthlyPrice: "Custom",
            yearlyPrice: "Custom",
            cta: "Contact Sales",
            highlighted: false,
            features: [
                "Everything in Growth",
                "Custom-Branded Careers Portal",
                "Unlimited Resume Parsing & Storage",
                "Resume AI Ranking & Summaries",
                "Advanced AI Analytics"
            ],
            aiTag: "Bundled AI + Volume Pricing"
        }
    ];

    return (
        <section className="mb-24 px-4">
            {/* Toggle */}
            <div className="flex justify-center mb-16">
                <div className="bg-muted p-1 rounded-full inline-flex relative">
                    <button
                        onClick={() => setIsYearly(false)}
                        className={cn(
                            "relative z-10 px-6 py-2.5 text-sm font-medium rounded-full transition-colors",
                            !isYearly ? "text-background" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => setIsYearly(true)}
                        className={cn(
                            "relative z-10 px-6 py-2.5 text-sm font-medium rounded-full transition-colors",
                            isYearly ? "text-background" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Yearly
                        <span className="ml-2 absolute -top-3 -right-6 inline-flex items-center rounded-full bg-foreground px-2 py-0.5 text-[0.65rem] font-bold text-background">
                            SAVE 15%
                        </span>
                    </button>

                    {/* Animated pill background */}
                    <div
                        className="absolute inset-1 bg-foreground rounded-full transition-transform duration-300 ease-in-out w-1/2 -ml-0.5"
                        style={{ transform: `translateX(${isYearly ? "100%" : "0"})` }}
                    />
                </div>
            </div>

            {/* Grid */}
            <div className="grid md:grid-cols-3 gap-8 items-start mx-auto relative z-10">
                {tiers.map((tier) => (
                    <div
                        key={tier.name}
                        className={cn(
                            "relative flex flex-col p-8 rounded-2xl border transition-all duration-300",
                            tier.highlighted
                                ? "border-foreground bg-background shadow-lg md:-mt-4"
                                : "border-border bg-muted/20 hover:border-foreground/30"
                        )}
                    >
                        <div className="mb-6">
                            <h3 className="text-xl font-bold mb-2">{tier.name}</h3>
                            <p className="text-sm text-muted-foreground h-10">{tier.description}</p>
                        </div>

                        <div className="mb-8">
                            <div className="flex items-baseline gap-1">
                                <span className={cn("text-4xl font-extrabold tracking-tight", tier.monthlyPrice === "Custom" && "text-3xl")}>
                                    {isYearly ? tier.yearlyPrice : tier.monthlyPrice}
                                </span>
                                {tier.monthlyPrice !== "Custom" && (
                                    <span className="text-muted-foreground font-medium">/ mo</span>
                                )}
                            </div>
                            {isYearly && tier.monthlyPrice !== "Custom" && (
                                <p className="text-xs text-muted-foreground mt-1">Billed annually</p>
                            )}
                        </div>

                        <Button
                            className={cn(
                                "w-full mb-8 font-semibold",
                                !tier.highlighted && "bg-background text-foreground border border-border hover:bg-muted"
                            )}
                            variant={tier.highlighted ? "default" : "outline"}
                            size="lg"
                        >
                            {tier.cta}
                        </Button>

                        <div className="flex-1 space-y-6">
                            <div className="flex items-center gap-2 text-sm font-medium text-foreground bg-muted/50 p-3 rounded-lg border border-border/50">
                                <Info className="w-4 h-4 text-foreground/50" />
                                {tier.aiTag}
                            </div>

                            <ul className="space-y-4">
                                {tier.features.map((feature, i) => (
                                    <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                                        <Check className="w-5 h-5 shrink-0 text-foreground" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
