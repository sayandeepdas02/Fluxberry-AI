"use client";

import { useState } from "react";
import { Check, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRICING_PLANS, formatPrice } from "@/features/pricing/pricing-plans";
import Link from "next/link";

export function PricingTiers() {
    const [isYearly, setIsYearly] = useState(false);

    return (
        <section className="mb-24 px-4">
            {/* Toggle */}
            <div className="flex items-center justify-center gap-4 mb-14">
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
                    </button>
                    {/* Animated pill */}
                    <div
                        className="absolute inset-1 bg-foreground rounded-full transition-transform duration-300 ease-in-out w-1/2 -ml-0.5 pointer-events-none"
                        style={{ transform: `translateX(${isYearly ? "100%" : "0"})` }}
                    />
                </div>
                {isYearly && (
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        Save up to 15%
                    </span>
                )}
            </div>

            {/* 4-column grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 items-start relative z-10">
                {PRICING_PLANS.map((plan) => (
                    <div
                        key={plan.id}
                        className={cn(
                            "relative flex flex-col p-7 rounded-2xl border transition-all duration-300",
                            plan.highlighted
                                ? "border-foreground bg-background shadow-xl lg:-mt-4"
                                : "border-border bg-muted/20 hover:border-foreground/30"
                        )}
                    >
                        {plan.highlighted && (
                            <div className="absolute -top-px left-1/2 -translate-x-1/2 -translate-y-1/2">
                                <span className="inline-block bg-foreground text-background text-[10px] uppercase tracking-widest px-3 py-[3px] rounded-full">
                                    Most Popular
                                </span>
                            </div>
                        )}

                        {/* Name + description */}
                        <div className="mb-5">
                            <h3 className="text-lg mb-1">{plan.name}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed min-h-[2.5rem]">
                                {plan.description}
                            </p>
                        </div>

                        {/* Price */}
                        <div className="mb-6 min-h-[56px]">
                            {plan.monthlyPrice === null ? (
                                <p className="text-2xl">Custom pricing</p>
                            ) : (
                                <>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl tracking-tight">
                                            {formatPrice(plan, isYearly)}
                                        </span>
                                        {plan.monthlyPrice > 0 && (
                                            <span className="text-muted-foreground font-medium">/ mo</span>
                                        )}
                                    </div>
                                    {isYearly && plan.monthlyPrice > 0 && (
                                        <p className="text-xs text-muted-foreground mt-1">Billed annually</p>
                                    )}
                                </>
                            )}
                        </div>

                        {/* CTA */}
                        {plan.ctaHref ? (
                            <Link
                                href={plan.ctaHref}
                                className={cn(
                                    "w-full mb-7 py-3 text-sm font-semibold rounded-xl text-center flex items-center justify-center gap-1.5 transition-all",
                                    plan.highlighted
                                        ? "bg-foreground text-background hover:opacity-90"
                                        : "border border-border bg-background hover:bg-muted text-foreground"
                                )}
                            >
                                {plan.cta}
                                {!plan.highlighted && <ArrowRight className="w-3.5 h-3.5" />}
                            </Link>
                        ) : (
                            <button
                                disabled={plan.ctaDisabled}
                                className={cn(
                                    "w-full mb-7 py-3 text-sm font-semibold rounded-xl transition-all",
                                    plan.ctaDisabled
                                        ? "border border-border text-muted-foreground bg-muted/40 cursor-default"
                                        : plan.highlighted
                                            ? "bg-foreground text-background hover:opacity-90"
                                            : "border border-border hover:bg-muted text-foreground"
                                )}
                            >
                                {plan.cta}
                            </button>
                        )}

                        {/* Divider */}
                        <div className="h-px bg-border mb-6" />

                        {/* Features */}
                        <ul className="space-y-3 flex-1">
                            {plan.features.map((feature, i) => (
                                <li key={i} className="flex gap-2.5 text-sm text-muted-foreground">
                                    <Check className="w-4 h-4 shrink-0 text-foreground mt-0.5" />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </section>
    );
}
