import { Quote } from "lucide-react"

const testimonials = [
    {
        quote: "Interview AI reduced our hiring time by 60%. The automated screening is a game changer for our engineering team.",
        name: "Sarah Chen",
        role: "VP of Engineering at TechFlow",
        initial: "S"
    },
    {
        quote: "Finally, a tool that helps us screen candidates objectively. We've seen a massive improvement in candidate quality.",
        name: "Marcus Rodriguez",
        role: "Head of Talent at StartUp Inc",
        initial: "M"
    },
    {
        quote: "The interface is intuitive and the candidates love the experience. It makes us look like a tech-first company.",
        name: "Emily Johnson",
        role: "Recruiting Manager at ScaleUp",
        initial: "E"
    }
]

export function Testimonials() {
    return (
        <section className="py-24 bg-white" id="testimonials">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
                        Trusted by modern hiring teams
                    </h2>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {testimonials.map((t, i) => (
                        <div key={i} className="bg-white border border-black/5 p-8 rounded-3xl relative shadow-sm hover:shadow-md transition-all">
                            <Quote className="h-8 w-8 text-primary/20 mb-4" />
                            <p className="text-lg text-slate-700 italic mb-6">"{t.quote}"</p>
                            <div className="flex items-center space-x-4">
                                <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-600 border border-slate-200">
                                    {t.initial}
                                </div>
                                <div>
                                    <div className="font-semibold text-slate-900">{t.name}</div>
                                    <div className="text-sm text-slate-500">{t.role}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
