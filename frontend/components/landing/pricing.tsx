"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

const plans = [
    {
        name: "Starter",
        price: { monthly: 29, yearly: 24 },
        description: "Perfect for early-stage startups.",
        features: ["5 Active Jobs", "50 AI Interviews/mo", "Basic Analytics", "Email Support"]
    },
    {
        name: "Growth",
        price: { monthly: 99, yearly: 79 },
        description: "For scaling teams and agencies.",
        popular: true,
        features: ["Unlimited Jobs", "500 AI Interviews/mo", "Advanced Analytics", "ATS Integration", "Priority Support"]
    },
    {
        name: "Enterprise",
        price: { monthly: 299, yearly: 249 },
        description: "Custom solutions for large orgs.",
        features: ["Unlimited Everything", "Custom AI Models", "SSO & SAML", "Dedicated Success Manager", "SLA"]
    }
]

export function Pricing() {
    const [isYearly, setIsYearly] = useState(true)

    return (
        <section className="py-24 bg-slate-50" id="pricing">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-4">
                        Simple, transparent pricing
                    </h2>
                    <p className="text-lg text-slate-600 mb-8">
                        Choose the plan that fits your hiring needs. Cancel anytime.
                    </p>

                    <div className="inline-flex items-center p-1 bg-white border rounded-full">
                        <button
                            onClick={() => setIsYearly(false)}
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${!isYearly ? "bg-primary text-white" : "text-slate-600 hover:text-slate-900"}`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setIsYearly(true)}
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${isYearly ? "bg-primary text-white" : "text-slate-600 hover:text-slate-900"}`}
                        >
                            Yearly <span className="ml-1 text-xs opacity-80">(Save 20%)</span>
                        </button>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {plans.map((plan) => (
                        <div key={plan.name} className={`relative p-8 rounded-3xl bg-white border border-black/5 ${plan.popular ? "shadow-xl ring-1 ring-primary/20 bg-gradient-to-b from-white to-primary/5" : "shadow-sm hover:shadow-md transition-all"}`}>
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                                    Most Popular
                                </div>
                            )}
                            <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                            <p className="text-slate-500 text-sm mb-6">{plan.description}</p>
                            <div className="flex items-baseline mb-6">
                                <span className="text-4xl font-bold text-slate-900">
                                    ${isYearly ? plan.price.yearly : plan.price.monthly}
                                </span>
                                <span className="text-slate-500 ml-2">/mo</span>
                            </div>
                            <ul className="space-y-3 mb-8">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-center text-sm text-slate-600">
                                        <Check className="h-4 w-4 text-primary mr-3 flex-shrink-0" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                            <Button className={`w-full ${plan.popular ? "" : "bg-slate-900 hover:bg-slate-800"}`}>
                                Get Started
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
