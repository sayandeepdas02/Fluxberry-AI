// Single source of truth for all pricing plans across /pricing and /dashboard/pricing

export interface PricingPlan {
    id: string;
    name: string;
    description: string;
    outcomeLine: string;
    motivationLine?: string;
    socialProof?: string;
    inheritsFrom?: string; // e.g. "Free" — renders as "Everything in Free, plus ↗"
    monthlyPrice: number | null; // null = custom
    yearlyPrice: number | null;
    cta: string;
    ctaHref: string | null;
    ctaDisabled: boolean;
    highlighted: boolean;
    features: string[];
    aiTag: string;
}

export const PRICING_PLANS: PricingPlan[] = [
    {
        id: "free",
        name: "Free",
        description: "Start hiring in minutes — zero setup, zero cost.",
        outcomeLine: "Post jobs and start receiving candidates instantly",
        monthlyPrice: 0,
        yearlyPrice: 0,
        cta: "Get Started",
        ctaHref: "/signup",
        ctaDisabled: false,
        highlighted: false,
        features: [
            "Post unlimited active jobs and gather candidates easily",
            "Invite your entire team with unlimited seats",
            "Setup a professional careers page in minutes",
            "Access built-in job board and track applicants seamlessly",
            "Deliver smooth talent onboarding out of the box",
            "1000 AI Credits included for instant intelligent screening",
            "100 monthly automated emails for seamless communication",
        ],
        aiTag: "1000 AI Credits included",
    },
    {
        id: "starter",
        name: "Starter",
        description: "Filter serious candidates automatically — stop wasting time on bad fits.",
        outcomeLine: "Shortlist top candidates before the first interview",
        motivationLine: "Stop manually screening candidates",
        socialProof: "⚡ Ideal for teams hiring 5–20 roles/month",
        monthlyPrice: 79,
        yearlyPrice: 49,
        cta: "Start 14 Day Trial",
        ctaHref: "/signup",
        ctaDisabled: false,
        highlighted: false,
        inheritsFrom: "Free",
        features: [
            "Built-in MCQ + DSA assessments to identify top candidates faster",
        ],
        aiTag: "Credit-based AI usage",
    },
    {
        id: "growth",
        name: "Growth",
        description: "Build a complete hiring machine — from application to final round, on autopilot.",
        outcomeLine: "Hire 3x faster with AI-driven workflows",
        motivationLine: "Stop manually managing your hiring pipeline",
        socialProof: "⭐ Used by fast-growing startups",
        monthlyPrice: 149,
        yearlyPrice: 119,
        cta: "Start 14 Day Trial",
        ctaHref: "/signup",
        ctaDisabled: false,
        highlighted: true,
        inheritsFrom: "Starter",
        features: [
            "Track hiring performance with actionable analytics",
            "Automate interview scheduling without back-and-forth emails",
            "Deploy advanced AI-driven assessments including System Design",
        ],
        aiTag: "Credit-based AI usage",
    },
    {
        id: "enterprise",
        name: "Enterprise",
        description: "Scale hiring across teams with enterprise-grade control and support.",
        outcomeLine: "Manage high-volume hiring without bottlenecks",
        motivationLine: "Scale hiring across teams with full control",
        socialProof: "🛡️ Trusted by industry leaders",
        monthlyPrice: 299,
        yearlyPrice: 209,
        cta: "Start 14 Day Trial",
        ctaHref: "mailto:sales@fluxberryai.com",
        ctaDisabled: false,
        highlighted: false,
        inheritsFrom: "Growth",
        features: [
            "Dedicated migration and premium onboarding support",
            "Proactive talent prospecting and high volume sourcing",
        ],
        aiTag: "Credit-based AI usage",
    },
];

export function formatPrice(plan: PricingPlan, yearly: boolean): string {
    const price = yearly ? plan.yearlyPrice : plan.monthlyPrice;
    if (price === null) return "Custom";
    if (price === 0) return "$0";
    return `$${price}`;
}
