import { Panel, PanelContent, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { FileType, ListChecks, GitBranch, Link2 } from "lucide-react";

export function CustomizableSolutions() {
    const solutions = [
        {
            icon: FileType,
            title: "Role-Specific Forms",
            description: "Design application flows tailored to each job.",
        },
        {
            icon: ListChecks,
            title: "Dynamic Question Types",
            description: "Text, numbers, file uploads, MCQs, coding prompts, and more.",
        },
        {
            icon: GitBranch,
            title: "Draft, Publish, Share",
            description: "Full lifecycle control with safe auto-save and versioning.",
        },
        {
            icon: Link2,
            title: "Public Job Links",
            description: "Share instantly. No candidate login required.",
        },
    ];

    return (
        <Panel>
            <PanelHeader>
                <PanelTitle>Customizable Hiring Workflows for Every Role</PanelTitle>
            </PanelHeader>

            <PanelContent className="py-12">
                <p className="text-lg text-muted-foreground mb-10">
                    Every role is different. Fluxberry AI adapts to your hiring needs.
                </p>

                <div className="grid gap-8 sm:grid-cols-2">
                    {solutions.map((solution, index) => {
                        const Icon = solution.icon;
                        return (
                            <div key={index} className="flex gap-4">
                                <div className="flex-shrink-0">
                                    <div className="inline-flex items-center justify-center size-10 rounded-lg bg-muted">
                                        <Icon className="size-5 text-foreground" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold mb-2">{solution.title}</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {solution.description}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </PanelContent>
        </Panel>
    );
}
