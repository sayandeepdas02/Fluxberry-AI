import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export function PricingFeatureTable({ className }: { className?: string } = {}) {
    const features = [
        {
            category: "Features",
            items: [
                { name: "Jobs", free: "Unlimited", starter: "Unlimited", growth: "Unlimited", enterprise: "Unlimited" },
                { name: "Candidates", free: "Unlimited", starter: "Unlimited", growth: "Unlimited", enterprise: "Unlimited" },
                { name: "Team Members", free: "Unlimited", starter: "Unlimited", growth: "Unlimited", enterprise: "Unlimited" },
                { name: "Careers Page", free: true, starter: true, growth: true, enterprise: true },
                { name: "AI Credits", free: "1000 / mo", starter: "1000 / mo", growth: "1000 / mo", enterprise: "1000 / mo" },
                { name: "Emails", free: "100 / mo", starter: "100 / mo", growth: "100 / mo", enterprise: "100 / mo" },
                { name: "Analytics", free: false, starter: false, growth: true, enterprise: true },
                { name: "Interview Scheduler", free: false, starter: false, growth: true, enterprise: true },
                { name: "Migration & Onboarding Support", free: false, starter: false, growth: false, enterprise: true },
            ],
        },
        {
            category: "Products",
            items: [
                { name: "Job Board", free: true, starter: true, growth: true, enterprise: true },
                { name: "ATS Screening", free: true, starter: true, growth: true, enterprise: true },
                { name: "Talent Onboarding", free: true, starter: true, growth: true, enterprise: true },
                { name: "Assessment (MCQ + DSA)", free: false, starter: true, growth: true, enterprise: true },
                { name: "Assessment (AI Screening)", free: false, starter: false, growth: true, enterprise: true },
                { name: "Assessment (System Design Round)", free: false, starter: false, growth: true, enterprise: true },
                { name: "Talent Prospect", free: false, starter: false, growth: false, enterprise: true },
            ],
        },
    ];

    const renderValue = (value: string | boolean) => {
        if (typeof value === "boolean") {
            return value
                ? <Check className="w-4 h-4 mx-auto text-foreground" />
                : <Minus className="w-4 h-4 mx-auto text-muted-foreground/30" />;
        }
        return <span className="text-sm font-medium text-foreground">{value}</span>;
    };

    return (
        <section className={className ?? "mb-24 px-4 overflow-x-auto"}>
            <h2 className="text-2xl mb-8 text-center">Compare All Features</h2>
            <div className="min-w-[700px] border border-border rounded-xl bg-background overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-5 bg-muted/50 border-b border-border px-4 py-3 sticky top-0">
                    <div className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Capabilities
                    </div>
                    {["Free", "Starter", "Growth", "Enterprise"].map((name) => (
                        <div
                            key={name}
                            className={cn(
                                "text-center text-sm ",
                                name === "Growth" ? "text-foreground" : "text-muted-foreground"
                            )}
                        >
                            {name}
                        </div>
                    ))}
                </div>

                {features.map((section, idx) => (
                    <div key={idx}>
                        <div className="bg-muted px-4 py-2.5 text-xs uppercase tracking-wider border-b border-border text-foreground/70">
                            {section.category}
                        </div>
                        {section.items.map((item, i) => (
                            <div
                                key={i}
                                className="grid grid-cols-5 items-center px-4 py-3 border-b border-border last:border-0 hover:bg-muted/10 transition-colors"
                            >
                                <div className="text-sm text-muted-foreground font-medium pr-4">{item.name}</div>
                                <div className="text-center">{renderValue(item.free)}</div>
                                <div className="text-center">{renderValue(item.starter)}</div>
                                <div className="text-center">{renderValue(item.growth)}</div>
                                <div className="text-center">{renderValue(item.enterprise)}</div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </section>
    );
}
