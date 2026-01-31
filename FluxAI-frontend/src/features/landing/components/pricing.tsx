import { Panel, PanelContent, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export function Pricing() {
    const plans = [
        {
            name: "Starter",
            originalPrice: "$4,000",
            price: "$2,000",
            discount: "20% off",
            description: "Perfect for MVPs, landing pages, or focused docs.",
            features: [
                "Up to 100 applications/month",
                "Basic resume parsing",
                "3 custom application forms",
                "Email support",
                "Basic analytics dashboard",
            ],
            cta: "Start today",
            highlighted: false,
        },
        {
            name: "Professional",
            originalPrice: "$9,000",
            price: "$6,500",
            discount: "40% off",
            description: "Full documentation site with a structured system.",
            features: [
                "Unlimited applications",
                "Advanced AI screening & scoring",
                "Unlimited custom forms",
                "Priority support (24/7)",
                "Advanced analytics & reporting",
                "Custom integrations (webhooks)",
                "Team collaboration tools",
            ],
            cta: "Start today",
            highlighted: true,
        },
        {
            name: "Enterprise",
            price: "$12k+",
            description: "End-to-end developer portal, fully tailored.",
            features: [
                "Everything in Professional",
                "Custom AI model training",
                "White-label solution",
                "SLA guarantee (99.9% uptime)",
                "On-premise deployment option",
                "Custom workflows & automation",
                "Dedicated account manager",
            ],
            cta: "Start today",
            highlighted: false,
        },
    ];

    return (
        <Panel id="pricing">
            <PanelHeader>
                <PanelTitle>Simple Plans, Built for Serious Teams</PanelTitle>
            </PanelHeader>

            <PanelContent className="py-16">
                <p className="text-center text-muted-foreground mb-4">
                    Anvil has a plan designed to meet your needs.
                </p>
                <p className="text-center text-muted-foreground mb-12">
                    No bloat, no fluff — just what works.
                </p>

                <div className="grid gap-6 md:grid-cols-3">
                    {plans.map((plan, index) => (
                        <div
                            key={index}
                            className={cn(
                                "relative border rounded-lg p-6 transition-all duration-200",
                                plan.highlighted
                                    ? "border-foreground bg-background"
                                    : "border-border bg-background hover:border-foreground/50"
                            )}
                        >
                            <div className="mb-6">
                                <h3 className="text-base font-medium text-muted-foreground mb-4">
                                    {plan.name}
                                </h3>

                                <div className="flex items-baseline gap-2 mb-4">
                                    {plan.originalPrice && (
                                        <span className="text-lg text-muted-foreground line-through">
                                            {plan.originalPrice}
                                        </span>
                                    )}
                                    <span className="text-3xl font-semibold">{plan.price}</span>
                                    {plan.discount && (
                                        <span className="text-sm text-muted-foreground">{plan.discount}</span>
                                    )}
                                </div>

                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {plan.description}
                                </p>
                            </div>

                            <ul className="space-y-3 mb-8">
                                {plan.features.map((feature, featureIndex) => (
                                    <li key={featureIndex} className="flex items-start gap-2">
                                        <Check className="size-4 text-foreground flex-shrink-0 mt-0.5" />
                                        <span className="text-sm text-foreground">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <Button
                                className={cn(
                                    "w-full",
                                    plan.highlighted ? "" : "bg-background border border-foreground text-foreground hover:bg-foreground hover:text-background"
                                )}
                                variant={plan.highlighted ? "default" : "outline"}
                            >
                                {plan.cta}
                            </Button>
                        </div>
                    ))}
                </div>

                <p className="text-center text-sm text-muted-foreground mt-8">
                    ⓘ Limited time discount on plans
                </p>
            </PanelContent>
        </Panel>
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ");
}
