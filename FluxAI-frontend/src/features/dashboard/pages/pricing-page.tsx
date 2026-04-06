"use client";

import { useState } from "react";
import { Check, Zap, ArrowRight, ArrowUpRight } from "lucide-react";
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
                            <div className="mb-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-base font-bold">{plan.name}</h3>
                                    {isCurrent && (
                                        <span className="text-[10px] uppercase font-bold tracking-wider bg-muted text-foreground px-2 py-0.5 rounded-sm">
                                            Current
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed mt-2" style={{ minHeight: "2.5rem" }}>
                                    {plan.description}
                                </p>
                            </div>

                            {/* Price */}
                            <div className="mb-4">
                                {plan.monthlyPrice === null ? (
                                    <p className="text-2xl font-bold text-foreground mb-4">Custom</p>
                                ) : (
                                    <>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-bold tracking-tight">
                                                {formatPrice(plan, isYearly)}
                                            </span>
                                            {plan.monthlyPrice > 0 && (
                                                <span className="text-xs text-muted-foreground">/ mo</span>
                                            )}
                                        </div>
                                        {isYearly && plan.monthlyPrice > 0 ? (
                                            <p className="text-[11px] text-muted-foreground mt-1 min-h-[16px]">
                                                Billed annually
                                            </p>
                                        ) : (
                                            <p className="min-h-[16px] mt-1"></p>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Outcome Line */}
                            <div className="mb-5 pb-5 border-b border-border">
                                <p className="text-foreground text-[13px] font-semibold leading-snug">
                                    {plan.outcomeLine}
                                </p>
                            </div>

                            {/* Features */}
                            <ul className="space-y-3 flex-1 mb-6">
                                {plan.inheritsFrom && (
                                    <li className="flex items-center gap-2 text-[12px] text-muted-foreground pb-3 border-b border-dashed border-border">
                                        <span className="leading-snug">Everything in {plan.inheritsFrom}, plus</span>
                                        <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/60" strokeWidth={2} />
                                    </li>
                                )}
                                {plan.features.map((feature, i) => (
                                    <li
                                        key={i}
                                        className="flex items-start gap-2 text-[12px] text-foreground"
                                    >
                                        <Check className="w-3.5 h-3.5 shrink-0 text-foreground mt-[2px]" strokeWidth={2.5} />
                                        <span className="leading-snug">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* Footer: Motivation, Social Proof, CTA */}
                            <div className="mt-auto flex flex-col gap-3 pt-2">
                                {plan.motivationLine && (
                                    <p className="text-[11px] text-muted-foreground text-center font-medium">
                                        {plan.motivationLine}
                                    </p>
                                )}

                                {plan.socialProof && (
                                    <p className="text-[10px] text-muted-foreground text-center font-medium">
                                        {plan.socialProof}
                                    </p>
                                )}

                                {isCurrent ? (
                                    <button
                                        disabled
                                        className="w-full py-2.5 text-sm font-semibold border border-border rounded-xl text-muted-foreground bg-muted/40 cursor-default"
                                    >
                                        Current Plan
                                    </button>
                                ) : plan.ctaHref ? (
                                    <Link
                                        href={plan.ctaHref}
                                        className={cn(
                                            "w-full py-2.5 text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5",
                                            plan.highlighted
                                                ? "bg-foreground text-background hover:bg-foreground/90 shadow-sm"
                                                : "border border-border hover:bg-muted text-foreground"
                                        )}
                                    >
                                        {plan.cta}
                                    </Link>
                                ) : (
                                    <button
                                        className={cn(
                                            "w-full py-2.5 text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5",
                                            plan.highlighted
                                                ? "bg-foreground text-background hover:bg-foreground/90 shadow-sm"
                                                : "border border-border hover:bg-muted text-foreground"
                                        )}
                                    >
                                        {plan.cta}
                                    </button>
                                )}
                            </div>
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
