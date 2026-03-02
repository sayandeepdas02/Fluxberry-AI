import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export function PricingFeatureTable({ className }: { className?: string } = {}) {
    const features = [
        {
            category: "Core Platform (Job Board + ATS)",
            items: [
                { name: "Active Job Posts", free: "3 posts", starter: "Unlimited", growth: "Unlimited", enterprise: "Unlimited" },
                { name: "Unlimited Hiring Pipelines", free: false, starter: true, growth: true, enterprise: true },
                { name: "Full ATS Workflow", free: "Basic", starter: true, growth: true, enterprise: true },
                { name: "Candidate Database Storage", free: "200", starter: "Up to 5,000", growth: "Up to 25,000", enterprise: "Unlimited" },
                { name: "Resume Parsing", free: false, starter: "Up to 2,000 / mo", growth: "Up to 10,000 / mo", enterprise: "Unlimited" },
                { name: "Careers Page", free: true, starter: "Standard", growth: "Standard", enterprise: "Custom-Branded Portal" },
                { name: "Email Automation", free: "25 / mo", starter: "10,000 / mo", growth: "25,000 / mo", enterprise: "Unlimited" },
                { name: "Advanced Hiring Workflows", free: false, starter: false, growth: true, enterprise: true },
                { name: "Slack Integration", free: false, starter: false, growth: true, enterprise: true },
                { name: "WhatsApp Integration", free: false, starter: false, growth: true, enterprise: true },
                { name: "Role-Based Access Controls", free: false, starter: "Basic", growth: "Advanced", enterprise: "Advanced" },
            ],
        },
        {
            category: "Talent Onboarding",
            items: [
                { name: "Onboarding Module", free: false, starter: false, growth: true, enterprise: true },
                { name: "Offer Letter Automation", free: false, starter: false, growth: true, enterprise: true },
                { name: "Document Collection Automation", free: false, starter: false, growth: true, enterprise: true },
                { name: "Policy & Compliance Workflows", free: false, starter: false, growth: "Basic", enterprise: "Advanced" },
            ],
        },
        {
            category: "AI & Interview Automation",
            items: [
                { name: "AI Credits Included", free: "200 / mo", starter: "2,000 / mo", growth: "10,000 / mo", enterprise: "Custom bundle" },
                { name: "MCQ Screening", free: false, starter: "Credit-based", growth: "50 / mo incl.", enterprise: "Custom bundle" },
                { name: "Coding Assessments", free: false, starter: "Credit-based", growth: "20 / mo incl.", enterprise: "Custom bundle" },
                { name: "AI Video Interviews", free: false, starter: false, growth: false, enterprise: "Custom bundle" },
                { name: "Resume AI Ranking", free: false, starter: false, growth: false, enterprise: true },
                { name: "AI Interview Summaries", free: false, starter: false, growth: false, enterprise: true },
                { name: "Advanced AI Analytics", free: false, starter: false, growth: false, enterprise: true },
            ],
        },
        {
            category: "Support & SLAs",
            items: [
                { name: "Support Channel", free: "Community", starter: "Email", growth: "Priority Email", enterprise: "Dedicated Manager" },
                { name: "SLA Guarantee", free: false, starter: false, growth: "99.9% uptime", enterprise: "99.99% uptime" },
                { name: "Migration & Onboarding Support", free: false, starter: false, growth: false, enterprise: true },
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
            <h2 className="text-2xl font-bold mb-8 text-center">Compare All Features</h2>
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
                                "text-center text-sm font-bold",
                                name === "Growth" ? "text-foreground" : "text-muted-foreground"
                            )}
                        >
                            {name}
                        </div>
                    ))}
                </div>

                {features.map((section, idx) => (
                    <div key={idx}>
                        <div className="bg-muted px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b border-border text-foreground/70">
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
