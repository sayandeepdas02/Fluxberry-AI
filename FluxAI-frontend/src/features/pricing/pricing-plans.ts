// Single source of truth for all pricing plans across /pricing and /dashboard/pricing

export interface PricingPlan {
    id: string;
    name: string;
    description: string;
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
        description: "Get started with the essentials.",
        monthlyPrice: 0,
        yearlyPrice: 0,
        cta: "Get Started",
        ctaHref: "/signup",
        ctaDisabled: false,
        highlighted: false,
        features: [
            "3 Active Job Posts",
            "Up to 200 Candidates",
            "Basic ATS Pipeline",
            "Careers Page",
            "200 AI Credits",
            "25 Emails / month",
        ],
        aiTag: "200 AI Credits included",
    },
    {
        id: "starter",
        name: "Starter",
        description: "Build your hiring engine with ATS + job board.",
        monthlyPrice: 149,
        yearlyPrice: 129,
        cta: "Get Started",
        ctaHref: "/signup",
        ctaDisabled: false,
        highlighted: false,
        features: [
            "Everything in Free",
            "Unlimited Job Posts & Pipelines",
            "Up to 5,000 Candidate Storage",
            "Standard Careers Page",
            "Basic Role-Based Access Controls",
            "2,000 AI Credits",
            "10,000 Emails / month",
            "Usage-based top-ups",
        ],
        aiTag: "Credit-based AI usage",
    },
    {
        id: "growth",
        name: "Growth",
        description: "Scale structured hiring with onboarding + automation.",
        monthlyPrice: 399,
        yearlyPrice: 329,
        cta: "Start Free Trial",
        ctaHref: "/signup",
        ctaDisabled: false,
        highlighted: true,
        features: [
            "Everything in Starter",
            "Advanced Hiring & Compliance Workflows",
            "Offer Letter & Document Automation",
            "Slack & WhatsApp Integration",
            "Up to 25,000 Candidate Storage",
            "Interview Automation",
            "Talent Onboarding Workflows",
            "Priority Support",
            "10,000 AI Credits",
            "25,000 Emails / month",
        ],
        aiTag: "Credit-based AI usage",
    },
    {
        id: "enterprise",
        name: "Enterprise",
        description: "High-volume AI hiring infrastructure with compliance & advanced analytics.",
        monthlyPrice: null,
        yearlyPrice: null,
        cta: "Contact Sales",
        ctaHref: "mailto:sales@fluxberryai.com",
        ctaDisabled: false,
        highlighted: false,
        features: [
            "Everything in Growth",
            "Custom-Branded Careers Portal",
            "Unlimited Resume Parsing & Storage",
            "Resume AI Ranking & Summaries",
            "Advanced AI Analytics",
            "Dedicated Account Manager",
            "Migration & Onboarding Support",
        ],
        aiTag: "Bundled AI + Volume Pricing",
    },
];

export function formatPrice(plan: PricingPlan, yearly: boolean): string {
    const price = yearly ? plan.yearlyPrice : plan.monthlyPrice;
    if (price === null) return "Custom";
    if (price === 0) return "$0";
    return `$${price}`;
}
