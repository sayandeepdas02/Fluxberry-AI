"use client";

import { useState } from "react";
import { Check, Zap, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRICING_PLANS, formatPrice } from "@/features/pricing/pricing-plans";
import { PricingFeatureTable } from "@/features/pricing/components/pricing-feature-table";
import { PricingAiCredits } from "@/features/pricing/components/pricing-ai-credits";
import Link from "next/link";

export function PricingPage() {
    const [isYearly, setIsYearly] = useState(true);
    // Simulate current plan — in production this comes from user/org context
    const currentPlanId = "free";

    return (
        <div className="py-8 px-10">
            {/* Page header */}
            <div className="mb-8">
                <h1 className="text-[22px] tracking-tight">Plans & Pricing</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Choose the plan that fits your team's hiring needs.
                </p>
            </div>

            {/* Billing toggle */}
            <div className="flex items-center gap-4 mb-8">
                <div className="bg-muted p-1 rounded-full inline-flex relative">
                    <button
                        onClick={() => setIsYearly(false)}
                        className={cn(
                            "relative z-10 px-5 py-1.5 text-sm font-medium rounded-full transition-colors",
                            !isYearly
                                ? "text-background"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Billed Monthly
                    </button>
                    <button
                        onClick={() => setIsYearly(true)}
                        className={cn(
                            "relative z-10 px-5 py-1.5 text-sm font-medium rounded-full transition-colors",
                            isYearly
                                ? "text-background"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Billed Yearly
                    </button>
                    <div
                        className="absolute inset-1 bg-foreground rounded-full transition-transform duration-300 ease-in-out w-1/2 pointer-events-none"
                        style={{ transform: `translateX(${isYearly ? "100%" : "0%"})` }}
                    />
                </div>
                {isYearly && (
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        Save up to 15%
                    </span>
                )}
            </div>

            {/* Plan cards */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-16">
                {PRICING_PLANS.map((plan) => {
                    const isCurrent = plan.id === currentPlanId;
                    return (
                        <div
                            key={plan.id}
                            className={cn(
                                "relative flex flex-col rounded-2xl border p-6 transition-all",
                                plan.highlighted
                                    ? "border-foreground bg-background shadow-md ring-1 ring-foreground/10"
                                    : "border-border bg-background hover:border-foreground/20"
                            )}
                        >
                            {plan.highlighted && (
                                <div className="absolute -top-px left-1/2 -translate-x-1/2 -translate-y-1/2">
                                    <span className="inline-block bg-foreground text-background text-[10px] uppercase tracking-widest px-3 py-[3px] rounded-full">
                                        Most Popular
                                    </span>
                                </div>
                            )}

                            {/* Plan name + description */}
                            <div className="mb-5">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-base">{plan.name}</h3>
                                    {isCurrent && (
                                        <span className="text-[10px] font-semibold bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                                            Current
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    {plan.description}
                                </p>
                            </div>

                            {/* Price */}
                            <div className="mb-5 min-h-[52px]">
                                {plan.monthlyPrice === null ? (
                                    <p className="text-xl text-foreground">Custom pricing</p>
                                ) : (
                                    <>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-[28px] tracking-tight">
                                                {formatPrice(plan, isYearly)}
                                            </span>
                                            {plan.monthlyPrice > 0 && (
                                                <span className="text-sm text-muted-foreground">/ mo</span>
                                            )}
                                        </div>
                                        {isYearly && plan.monthlyPrice > 0 && (
                                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                                Billed annually
                                            </p>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* CTA */}
                            {isCurrent ? (
                                <button
                                    disabled
                                    className="w-full py-2 mb-5 text-sm font-medium border border-border rounded-xl text-muted-foreground bg-muted/40 cursor-default"
                                >
                                    Current Plan
                                </button>
                            ) : plan.id === "enterprise" ? (
                                <Link
                                    href="mailto:sales@fluxberryai.com"
                                    className="w-full py-2 mb-5 text-sm font-semibold border border-border rounded-xl text-foreground hover:bg-muted transition-colors text-center flex items-center justify-center gap-1.5"
                                >
                                    {plan.cta}
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            ) : (
                                <button
                                    className={cn(
                                        "w-full py-2 mb-5 text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5",
                                        plan.highlighted
                                            ? "bg-foreground text-background hover:opacity-90"
                                            : "border border-border hover:bg-muted text-foreground"
                                    )}
                                >
                                    <Zap className="w-3.5 h-3.5" />
                                    Upgrade
                                </button>
                            )}

                            {/* Divider */}
                            <div className="h-px bg-border mb-5" />

                            {/* Features */}
                            <ul className="space-y-2.5 flex-1">
                                {plan.features.map((feature, i) => (
                                    <li
                                        key={i}
                                        className="flex items-start gap-2 text-[13px] text-muted-foreground"
                                    >
                                        <Check className="w-3.5 h-3.5 shrink-0 text-foreground mt-[2px]" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    );
                })}
            </div>

            {/* Feature comparison table */}
            <PricingFeatureTable className="mb-16 overflow-x-auto" />

            {/* Cost estimator calculator */}
            <PricingAiCredits />

            {/* Footer note */}
            <p className="text-center text-xs text-muted-foreground mt-4 mb-8">
                All plans include a 14-day free trial. No credit card required.{" "}
                <Link
                    href="mailto:support@fluxberryai.com"
                    className="text-foreground font-medium hover:underline underline-offset-2"
                >
                    Need help choosing?
                </Link>
            </p>
        </div>
    );
}
