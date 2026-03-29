"use client";

import React, { useState } from "react";
import { useSubscription } from "@/lib/subscription/subscription-context";
import { PricingTier } from "@/lib/subscription/types";
import { 
    Zap, 
    Check, 
    Clock, 
    CreditCard,
    LayoutDashboard,
    AlertCircle,
    Building2,
    CheckCircle2,
    Search
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PricingDashboardPage() {
    const { config, upgradePlan, getTrialDaysRemaining } = useSubscription();
    const [billingCycle, setBillingCycle] = useState<"monthly" | "annually">("annually");

    const handleUpgrade = (tier: PricingTier) => {
        // Optimistic UI state
        upgradePlan(tier);
        alert(`Successfully upgraded to ${tier.toUpperCase()} plan.`);
    };

    const MOCK_PLANS = [
        {
            id: 'free',
            name: 'Hobby',
            price: 0,
            features: ['Core ATS Engine (1,000 resumes)', 'Standard Job Board', 'Basic Support'],
            tier: 'free' as PricingTier
        },
        {
            id: 'growth',
            name: 'Growth',
            price: billingCycle === 'annually' ? 149 : 199,
            features: ['Unlimited Resumes', 'Full Analytics Suite', 'API Access', '500 Sourcing Credits/mo', '10 Active Workflows'],
            tier: 'growth' as PricingTier,
            popular: true
        },
        {
            id: 'scale',
            name: 'Scale',
            price: billingCycle === 'annually' ? 399 : 499,
            features: ['Everything in Growth', 'Priority Routing', '2000 Sourcing Credits/mo', 'Dedicated Success Manager', 'SSO/SAML'],
            tier: 'scale' as PricingTier
        }
    ];

    const talentProspectData = config.apps['talent_prospect'];
    const creditsUsed = talentProspectData?.installed ? (1000 - (talentProspectData.limits?.credits || 0)) : null;

    return (
        <div className="flex flex-col h-full overflow-y-auto bg-muted/5 relative">
            
            <div className="max-w-6xl mx-auto w-full p-8 md:p-12">
                {/* Dashboard Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-b border-line pb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight mb-2">Billing & Limits</h1>
                        <p className="text-muted-foreground whitespace-pre-line">
                            Manage your workspace plan, active trials, and modular billing usage.
                        </p>
                    </div>

                    <div className="flex gap-4">
                        {/* Summary Pill 1 */}
                        <div className="px-4 py-3 bg-card border border-line rounded-none flex items-center gap-4">
                            <div className="w-10 h-10 bg-primary/10 flex items-center justify-center">
                                <Zap className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Current Plan</p>
                                <p className="text-lg font-bold capitalize">{config.plan === 'free' && config.trialActive ? '14-Day Trial' : config.plan}</p>
                            </div>
                        </div>
                        {/* Summary Pill 2 */}
                        <div className={`px-4 py-3 border rounded-none flex items-center gap-4 ${config.trialActive ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-card border-line'}`}>
                            <div className={`w-10 h-10 flex items-center justify-center ${config.trialActive ? 'bg-emerald-500/20' : 'bg-muted'}`}>
                                <Clock className={`w-5 h-5 ${config.trialActive ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Time Remaining</p>
                                <p className={`text-lg font-bold ${config.trialActive ? 'text-emerald-600' : ''}`}>
                                    {config.trialActive ? `${getTrialDaysRemaining()} days` : 'Permanent'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sub-Limits Area (App specific Usage) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                    {/* Add-on Tracker: Sourcing Credits */}
                    <div className="p-6 bg-card border border-line">
                         <div className="flex items-start justify-between mb-4">
                             <div>
                                 <h3 className="font-semibold flex items-center gap-2">
                                     <Search className="w-4 h-4 text-primary" />
                                     Sourcing Credits
                                 </h3>
                                 <p className="text-sm text-muted-foreground mt-1">Used to unlock restricted AI candidate profiles natively.</p>
                             </div>
                             {talentProspectData?.installed ? (
                                <span className="px-2 py-1 bg-emerald-500/10 text-emerald-600 text-xs font-bold border border-emerald-500/20">Active</span>
                             ) : (
                                <span className="px-2 py-1 bg-muted text-muted-foreground text-xs font-medium border border-line">Not Installed</span>
                             )}
                         </div>

                         {talentProspectData?.installed ? (
                            <div className="space-y-2 mt-6">
                                <div className="flex justify-between text-sm font-semibold">
                                    <span>{creditsUsed} Used</span>
                                    <span>1000 Total</span>
                                </div>
                                <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden">
                                     <div className="h-full bg-primary" style={{ width: `${(creditsUsed! / 1000) * 100}%` }} />
                                </div>
                            </div>
                         ) : (
                             <div className="mt-6 flex items-center gap-3 p-3 border border-line bg-muted/20">
                                 <AlertCircle className="w-5 h-5 text-muted-foreground" />
                                 <p className="text-sm text-muted-foreground">App not installed. Sourcing credits inactive.</p>
                             </div>
                         )}
                    </div>
                </div>

                {/* Pricing Plans List */}
                <div className="text-center mb-10">
                    <h2 className="text-2xl font-bold mb-4">Upgrade Your Stack</h2>
                    
                    {/* Annually/Monthly toggle */}
                    <div className="inline-flex bg-muted/20 p-1 border border-line">
                        <button
                            onClick={() => setBillingCycle("monthly")}
                            className={`px-6 py-2 text-sm font-medium transition-colors ${billingCycle === "monthly" ? "bg-card border border-line text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            Monthly payout
                        </button>
                        <button
                            onClick={() => setBillingCycle("annually")}
                            className={`px-6 py-2 text-sm font-medium transition-colors ${billingCycle === "annually" ? "bg-card border border-line text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            Annually (Save 20%)
                        </button>
                    </div>
                </div>

                {/* Plan Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch pt-4">
                    {MOCK_PLANS.map((plan) => (
                        <div 
                            key={plan.id} 
                            className={`bg-card border p-8 flex flex-col transition-all relative
                                ${plan.popular ? 'border-primary/50 shadow-md ring-1 ring-primary/20 scale-105 z-10' : 'border-line'}
                            `}
                        >
                            {plan.popular && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1.5 uppercase tracking-wider">
                                    Most Popular
                                </div>
                            )}
                            {config.plan === plan.tier && !config.trialActive && (
                                <div className="absolute top-4 right-4 text-emerald-500 font-bold text-xs flex items-center gap-1">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Active Plan
                                </div>
                            )}
                            
                            <h3 className="text-xl font-bold">{plan.name}</h3>
                            <div className="mt-4 mb-6 flex items-baseline">
                                <span className="text-4xl font-extrabold tracking-tight">${plan.price}</span>
                                <span className="text-muted-foreground ml-2">/mo</span>
                            </div>
                            
                            <Button 
                                onClick={() => handleUpgrade(plan.tier)}
                                disabled={config.plan === plan.tier && !config.trialActive}
                                className={`w-full mb-8 rounded-none transition-all h-10 ${
                                    plan.popular 
                                        ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                                        : 'bg-foreground text-background hover:bg-foreground/90'
                                }`}
                            >
                                {config.plan === plan.tier && !config.trialActive ? 'Current Plan' : `Upgrade to ${plan.name}`}
                            </Button>

                            <ul className="space-y-4 flex-1 text-sm text-foreground/80">
                                {plan.features.map(f => (
                                    <li key={f} className="flex items-start gap-3">
                                        <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                        <span>{f}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Enterprise Footer CTA */}
                <div className="mt-16 bg-muted/20 border border-line p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-background border border-line rounded-none flex items-center justify-center shrink-0">
                            <Building2 className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold">Enterprise Deployment</h3>
                            <p className="text-muted-foreground max-w-lg mt-1">Need SAML SSO, dedicated infrastructure, or unlimited candidate API throughput? We can scale the entire platform to your needs.</p>
                        </div>
                    </div>
                    <Button variant="outline" className="rounded-none border-line whitespace-nowrap px-8 h-10">
                        Contact Sales
                    </Button>
                </div>

            </div>
        </div>
    );
}
