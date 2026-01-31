import { Panel, PanelContent, PanelHeader, PanelTitle } from "@/components/ui/panel";

export function HowItWorks() {
    const steps = [
        { phase: "Discover", number: "01", title: "Provide goals" },
        { phase: "Discover", number: "02", title: "Research" },
        { phase: "Map", number: "03", title: "Structuring" },
        { phase: "Design", number: "04", title: "UI design" },
        { phase: "Build", number: "05", title: "Development" },
        { phase: "Build", number: "06", title: "Deployment" },
    ];

    const phases = ["Discover", "Map", "Design", "Build"];

    return (
        <Panel>
            <PanelHeader>
                <PanelTitle>A Clear Method for Hiring Success</PanelTitle>
            </PanelHeader>

            <PanelContent className="py-16">
                <p className="text-center text-muted-foreground mb-12">
                    We walk you through each step according to your needs
                </p>

                {/* Phase tabs */}
                <div className="flex justify-center gap-8 mb-16 border-b border-border pb-8">
                    {phases.map((phase) => (
                        <div
                            key={phase}
                            className="text-center px-6 py-2 border-b-2 border-transparent hover:border-foreground transition-colors cursor-pointer"
                        >
                            <span className="font-medium">{phase}</span>
                        </div>
                    ))}
                </div>

                {/* Process flow */}
                <div className="grid grid-cols-2 gap-8 max-w-3xl mx-auto mb-16">
                    {steps.map((step) => (
                        <div
                            key={step.number}
                            className="border border-border rounded-lg p-6 bg-muted/20 hover:bg-muted/40 transition-colors"
                        >
                            <div className="text-sm font-mono text-muted-foreground mb-2">
                                {step.number}
                            </div>
                            <h3 className="text-lg font-semibold">{step.title}</h3>
                        </div>
                    ))}
                </div>

                {/* Stats section */}
                <div>
                    <h3 className="text-2xl font-semibold mb-8 text-center">
                        Results that Move the Needle
                    </h3>
                    <p className="text-muted-foreground mb-12 max-w-xl mx-auto text-center">
                        Our AI-powered system helps increase efficiency, shorten onboarding time,
                        and reduce the burden on your hiring team.
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="border border-border rounded-lg p-8 text-center bg-muted/20">
                            <div className="text-4xl font-bold mb-2">+68%</div>
                            <div className="text-sm text-muted-foreground">Hiring efficiency</div>
                        </div>
                        <div className="border border-border rounded-lg p-8 text-center bg-muted/20">
                            <div className="text-4xl font-bold mb-2">300%</div>
                            <div className="text-sm text-muted-foreground">Faster screening</div>
                        </div>
                        <div className="border border-border rounded-lg p-8 text-center bg-muted/20">
                            <div className="text-4xl font-bold mb-2">+50%</div>
                            <div className="text-sm text-muted-foreground">Quality hires</div>
                        </div>
                        <div className="border border-border rounded-lg p-8 text-center bg-muted/20">
                            <div className="text-4xl font-bold mb-2">+35%</div>
                            <div className="text-sm text-muted-foreground">Team satisfaction</div>
                        </div>
                    </div>
                </div>
            </PanelContent>
        </Panel>
    );
}
