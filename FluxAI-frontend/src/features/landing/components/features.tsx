import { Panel, PanelContent, PanelHeader, PanelTitle } from "@/components/ui/panel";

export function Features() {
    const features = [
        {
            number: "01",
            title: "Structured Applications",
            description: "Replace resume guessing with high-signal questions that actually matter.",
        },
        {
            number: "02",
            title: "Resume Parsing Engine",
            description: "Automatically extract skills, experience, education, and roles from any format.",
        },
        {
            number: "03",
            title: "Candidate Intelligence",
            description: "Turn messy PDFs into searchable, comparable candidate profiles.",
        },
        {
            number: "04",
            title: "Automated Screening",
            description: "MCQs, coding challenges, and AI-led interviews at scale.",
        },
        {
            number: "05",
            title: "Bias-Reduced Hiring",
            description: "Evaluate candidates consistently and objectively, every time.",
        },
        {
            number: "06",
            title: "Scalable Architecture",
            description: "Designed for startups today and scale-ups tomorrow.",
        },
        {
            number: "07",
            title: "Real-Time Analytics",
            description: "Track hiring metrics and optimize your funnel continuously.",
        },
        {
            number: "08",
            title: "Integration Ready",
            description: "Connect with your existing tools via API or webhooks.",
        },
    ];

    return (
        <Panel id="features">
            <PanelHeader>
                <PanelTitle>Everything You Need for Modern Hiring</PanelTitle>
            </PanelHeader>

            <PanelContent className="py-16">
                <p className="text-lg text-muted-foreground mb-12 max-w-2xl">
                    From application to offer, FluxAI delivers tools that improve clarity, usability,
                    and candidate experience — end to end.
                </p>

                <div className="grid gap-6 sm:grid-cols-2">
                    {features.map((feature) => (
                        <div
                            key={feature.number}
                            className="group relative border border-border rounded-lg p-6 bg-muted/30 hover:bg-muted/50 transition-colors duration-200"
                        >
                            <div className="text-sm font-mono text-muted-foreground mb-3">
                                {feature.number}
                            </div>
                            <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </PanelContent>
        </Panel>
    );
}
