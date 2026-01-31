import { Panel, PanelContent, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { TrendingDown, Clock, TrendingUp } from "lucide-react";

export function WhyChooseUs() {
    const benefits = [
        {
            icon: TrendingDown,
            title: "Reduce Cost Per Hire",
            description:
                "Cut recruiter and engineering hours spent on low-quality candidates.",
        },
        {
            icon: Clock,
            title: "Hire Faster",
            description: "Shortlist in hours, not weeks.",
        },
        {
            icon: TrendingUp,
            title: "Improve Hiring Outcomes",
            description: "Focus on skills, not resume formatting.",
        },
    ];

    const stats = [
        { value: "100k+", label: "applications processed" },
        { value: "78k+", label: "candidates screened" },
        { value: "4.9/5", label: "recruiter satisfaction" },
    ];

    return (
        <Panel>
            <PanelHeader>
                <PanelTitle>The Best Fit for Teams That Care About Hiring Quality</PanelTitle>
            </PanelHeader>

            <PanelContent className="py-12">
                <div className="grid gap-8 md:grid-cols-3 mb-12">
                    {benefits.map((benefit, index) => {
                        const Icon = benefit.icon;
                        return (
                            <div key={index} className="text-center">
                                <div className="mb-4 inline-flex items-center justify-center size-14 rounded-lg bg-muted">
                                    <Icon className="size-7 text-foreground" />
                                </div>
                                <h3 className="text-xl font-semibold mb-3">{benefit.title}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {benefit.description}
                                </p>
                            </div>
                        );
                    })}
                </div>

                <div className="grid grid-cols-3 gap-8 pt-12 border-t border-edge">
                    {stats.map((stat, index) => (
                        <div key={index} className="text-center">
                            <div className="text-4xl md:text-5xl font-bold mb-2">{stat.value}</div>
                            <div className="text-sm text-muted-foreground">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </PanelContent>
        </Panel>
    );
}
