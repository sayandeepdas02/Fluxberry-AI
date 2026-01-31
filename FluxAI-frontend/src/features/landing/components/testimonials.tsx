import { Panel, PanelContent, PanelHeader, PanelTitle } from "@/components/ui/panel";

export function Testimonials() {
    const testimonials = [
        {
            quote:
                "FluxAI reduced our resume screening time by over 70%. We now interview only candidates who actually fit the role. The AI screening is remarkably accurate and has completely transformed our hiring process.",
            author: "Sarah Chen",
            role: "Head of Engineering",
            company: "TechStart Inc",
        },
        {
            quote:
                "The structured application approach completely changed how we evaluate candidates. Instead of guessing from resumes, we get real signals upfront. Our quality of hire has improved dramatically.",
            author: "Michael Rodriguez",
            role: "VP of Talent",
            company: "GrowthCo",
        },
        {
            quote:
                "Setting up FluxAI took less than an hour, and we were processing applications the same day. The ROI was immediate — our recruiters now spend time talking to great candidates instead of sorting through noise.",
            author: "Jamie Park",
            role: "Recruiting Lead",
            company: "Scale Ventures",
        },
    ];

    return (
        <Panel id="testimonials">
            <PanelHeader>
                <PanelTitle>Trusted by Teams Building the Future</PanelTitle>
            </PanelHeader>

            <PanelContent className="py-16">
                <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
                    See what hiring teams are saying about FluxAI
                </p>

                <div className="grid gap-6 md:grid-cols-3">
                    {testimonials.map((testimonial, index) => (
                        <div
                            key={index}
                            className="border border-border rounded-lg p-8 bg-background hover:border-foreground/50 transition-colors duration-200"
                        >
                            <blockquote className="text-sm leading-relaxed mb-6">
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
