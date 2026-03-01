import { Panel, PanelContent, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { TrendingDown, Clock, TrendingUp } from "lucide-react";

export function WhyChooseUs() {
    const benefits = [
        {
            icon: TrendingDown,
            title: "Effortless Experience",
            description: "Fluxberry AI enables instant, intuitive, beautifully designed HR workflows.",
        },
        {
            icon: Clock,
            title: "Seamless Integration",
            description: "Fluxberry AI uses AI to streamline and connect various tools.",
        },
        {
            icon: TrendingUp,
            title: "Scalable Automation",
            description: "Fluxberry AI integrates, scales, provides insights, and optimizes growth.",
        },
    ];

    return (
        <Panel>
            <PanelHeader>
                <div className="flex flex-col items-start gap-4">
                    <span className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                        <span className="text-foreground text-xs">●</span> Why Fluxberry AI
                    </span>
                    <PanelTitle className="text-3xl md:text-5xl">Why Fluxberry AI?</PanelTitle>
                </div>
            </PanelHeader>

            <PanelContent className="py-12">
                <div className="grid gap-8 md:grid-cols-3 mb-12">
                    {benefits.map((benefit, index) => {
                        const Icon = benefit.icon;
                        return (
                            <div key={index} className="text-center group p-6 border border-border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                                <div className="mb-6 inline-flex items-center justify-center size-14 rounded-lg bg-background border border-border group-hover:border-foreground/30 transition-colors">
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
            </PanelContent>
        </Panel>
    );
}
