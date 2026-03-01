import { Panel, PanelContent, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { CopyIcon, CheckCircle2, UserPlus, Settings2, BellRing, BarChart3, TrendingUpIcon } from "lucide-react";

export function ValueProposition() {
    const solutions = [
        {
            number: "01",
            title: "Talent Sourcing",
            description: "Fluxberry AI streamlines onboarding, from offer letters to first-day checklists.",
            bullets: [
                { icon: CopyIcon, text: "Digital signing" },
                { icon: CheckCircle2, text: "Setup checklists" },
                { icon: UserPlus, text: "Role permissions" }
            ]
        },
        {
            number: "02",
            title: "Job Board & ATS",
            description: "Manage policies, compliance, acknowledgments — all in one place, staying ahead.",
            bullets: [
                { icon: Settings2, text: "Policy hub" },
                { icon: UserPlus, text: "Staff acknowledgment" },
                { icon: BellRing, text: "Compliance alerts" }
            ]
        },
        {
            number: "03",
            title: "Interview Assessment",
            description: "Dashboards reveal trends, driving smarter HR decisions from workforce data.",
            bullets: [
                { icon: BarChart3, text: "Real-time metrics" },
                { icon: TrendingUpIcon, text: "Retention trends" },
                { icon: Settings2, text: "Custom dashboards" }
            ]
        },
        {
            number: "04",
            title: "Talent Onboarding",
            description: "Manage policies, compliance, acknowledgments — all in one place, staying ahead.",
            bullets: [
                { icon: Settings2, text: "Policy hub" },
                { icon: UserPlus, text: "Staff acknowledgment" },
                { icon: BellRing, text: "Compliance alerts" }
            ]
        },
    ];

    return (
        <Panel id="solutions">
            <PanelHeader>
                <div className="flex flex-col items-start gap-4">
                    <span className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                        <span className="text-foreground text-xs">●</span> Solutions
                    </span>
                    <PanelTitle className="text-3xl md:text-5xl max-w-2xl leading-tight">
                        All in one Platform for your<br />hiring automation
                    </PanelTitle>
                </div>
            </PanelHeader>

            <PanelContent className="py-16">
                <div className="grid gap-6 sm:grid-cols-2">
                    {solutions.map((solution) => (
                        <div
                            key={solution.number}
                            className="border border-border rounded-lg p-6 bg-muted/30 hover:bg-muted/50 transition-colors duration-200"
                        >
                            <div className="text-sm font-mono text-muted-foreground mb-3">
                                {solution.number}
                            </div>
                            <h3 className="text-xl font-semibold mb-2">{solution.title}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                                {solution.description}
                            </p>

                            <ul className="space-y-3">
                                {solution.bullets.map((item, i) => {
                                    const Icon = item.icon;
                                    return (
                                        <li key={i} className="flex items-center gap-3 text-muted-foreground font-medium text-sm">
                                            <Icon className="w-4 h-4 text-foreground/50" />
                                            {item.text}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </div>
            </PanelContent>
        </Panel>
    );
}

