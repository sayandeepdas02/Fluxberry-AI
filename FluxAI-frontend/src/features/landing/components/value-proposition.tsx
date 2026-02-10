import { Panel, PanelContent, PanelHeader, PanelTitle } from "@/components/ui/panel";

export function ValueProposition() {
    const solutions = [
        {
            number: "01",
            title: "Custom Application Forms",
            description: "Design application flows tailored to each job. Ask the right questions upfront.",
        },
        {
            number: "02",
            title: "Automated Resume Understanding",
            description: "Instantly extract skills, experience, and insights from any resume format.",
        },
        {
            number: "03",
            title: "Centralized ATS",
            description: "Track, review, and compare candidates in one clean, organized dashboard.",
        },
        {
            number: "04",
            title: "AI-Powered Screening",
            description: "Automatically filter and score candidates before human interviews begin.",
        },
    ];

    return (
        <Panel id="solutions">
            <PanelHeader>
                <PanelTitle>Perfect Every Step of Hiring</PanelTitle>
            </PanelHeader>

            <PanelContent className="py-16">
                <p className="text-lg text-muted-foreground mb-12 max-w-2xl">
                    Fluxberry AI replaces fragmented hiring tools with a single intelligent system built for modern teams.
                </p>

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
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {solution.description}
                            </p>
                        </div>
                    ))}
                </div>
            </PanelContent>
        </Panel>
    );
}
