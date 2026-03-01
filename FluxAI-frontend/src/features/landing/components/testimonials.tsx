import { Panel, PanelContent, PanelHeader, PanelTitle } from "@/components/ui/panel";

export function Testimonials() {
    const testimonials = [
        {
            quote: "Fluxberry AI has reinvented our hiring process. Our teams now focus on finding the right fit, rather than tedious administrative tasks.",
            author: "Aman Jain",
            role: "CEO",
            company: "TechCorp",
        },
        {
            quote: "Since implementing Fluxberry AI, we've cut our time-to-hire in half. The automation handles the heavy lifting seamlessly.",
            author: "Sita Patel",
            role: "HR Director",
            company: "InnovateX",
        },
        {
            quote: "The predictive analytics are a game-changer. We're not just filling roles anymore; we're building a future-proof team.",
            author: "Vikram Singh",
            role: "Talent Acquisition Lead",
            company: "FutureWorks",
        },
    ];

    return (
        <Panel id="testimonials">
            <PanelHeader>
                <div className="flex flex-col items-center text-center gap-4 mb-8">
                    <span className="text-sm font-semibold text-muted-foreground flex items-center justify-center gap-2">
                        <span className="text-foreground text-xs">●</span> Customer Feedback
                    </span>
                    <PanelTitle className="text-3xl md:text-5xl max-w-2xl leading-tight">
                        Join 5,000+ teams who have already switched
                    </PanelTitle>
                </div>
            </PanelHeader>

            <PanelContent className="py-8">
                <div className="grid gap-6 md:grid-cols-3">
                    {testimonials.map((testimonial, index) => (
                        <div
                            key={index}
                            className="border border-border rounded-lg p-8 bg-muted/30 hover:bg-muted/50 transition-colors duration-200 flex flex-col justify-between"
                        >
                            <blockquote className="text-sm leading-relaxed mb-8">
                                "{testimonial.quote}"
                            </blockquote>

                            <div className="pt-6 border-t border-border">
                                <div className="font-semibold text-sm">{testimonial.author}</div>
                                <div className="text-sm text-muted-foreground mt-1">
                                    {testimonial.role}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    {testimonial.company}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </PanelContent>
        </Panel>
    );
}
