import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export function PricingFeatureTable() {
    const features = [
        {
            category: "Core Platform (Job Board + ATS)",
            items: [
                { name: "Unlimited Job Posts", starter: true, growth: true, enterprise: true },
                { name: "Unlimited Hiring Pipelines", starter: true, growth: true, enterprise: true },
                { name: "Full ATS Workflow", starter: true, growth: true, enterprise: true },
                { name: "Standard Careers Page", starter: true, growth: true, enterprise: false },
                { name: "Custom-Branded Careers Portal", starter: false, growth: false, enterprise: true },
                { name: "Resume Parsing", starter: "Up to 2,000 / mo", growth: "Up to 10,000 / mo", enterprise: "Unlimited" },
                { name: "Candidate Database Storage", starter: "Up to 5,000", growth: "Up to 25,000", enterprise: "Unlimited" },
                { name: "Advanced Hiring Workflows", starter: false, growth: true, enterprise: true },
                { name: "Email Automation", starter: "5,000 emails / mo", growth: "25,000 emails / mo", enterprise: "Unlimited" },
                { name: "Slack Integration", starter: false, growth: true, enterprise: true },
                { name: "WhatsApp Integration", starter: false, growth: true, enterprise: true },
            ]
        },
        {
            category: "Talent Onboarding",
            items: [
                { name: "Onboarding Module", starter: false, growth: true, enterprise: true },
                { name: "Offer Letter Automation", starter: false, growth: true, enterprise: true },
                { name: "Document Collection Automation", starter: false, growth: true, enterprise: true },
                { name: "Policy & Compliance Workflows", starter: false, growth: "Basic", enterprise: "Advanced" },
                { name: "Role-Based Access Controls", starter: "Basic", growth: "Advanced", enterprise: "Advanced" },
            ]
        },
        {
            category: "AI & Interview Automation",
            items: [
                { name: "MCQ Screening Included", starter: false, growth: "50 / month", enterprise: "Custom bundle" },
                { name: "Coding Assessments Included", starter: false, growth: "20 / month", enterprise: "Custom bundle" },
                { name: "AI Video Interviews Included", starter: false, growth: false, enterprise: "Custom bundle" },
                { name: "Resume AI Ranking", starter: false, growth: false, enterprise: true },
                { name: "AI Interview Summaries", starter: false, growth: false, enterprise: true },
                { name: "Advanced AI Analytics", starter: false, growth: false, enterprise: true },
            ]
        }
    ];

    const renderValue = (value: string | boolean) => {
        if (typeof value === "boolean") {
            return value ? <Check className="w-5 h-5 mx-auto text-foreground" /> : <Minus className="w-5 h-5 mx-auto text-muted-foreground/30" />;
        }
        return <span className="text-sm font-medium text-foreground">{value}</span>;
    };

    return (
        <section className="mb-24 px-4 overflow-x-auto">
            <h2 className="text-2xl font-bold mb-8 text-center">Compare All Features</h2>
            <div className="min-w-[800px] border border-border rounded-xl bg-background overflow-hidden">
                <div className="grid grid-cols-4 bg-muted/50 border-b border-border p-4 sticky top-0 font-bold text-sm">
                    <div className="text-left text-muted-foreground">Capabilities</div>
                    <div className="text-center">Starter</div>
                    <div className="text-center text-foreground">Growth</div>
                    <div className="text-center text-muted-foreground">Enterprise</div>
                </div>

                {features.map((section, idx) => (
                    <div key={idx}>
                        <div className="bg-muted px-4 py-3 text-sm font-bold border-b border-border text-foreground/80">
                            {section.category}
                        </div>
                        {section.items.map((item, i) => (
                            <div key={i} className="grid grid-cols-4 items-center p-4 border-b border-border last:border-0 hover:bg-muted/10 transition-colors">
                                <div className="text-sm text-muted-foreground font-medium">{item.name}</div>
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
