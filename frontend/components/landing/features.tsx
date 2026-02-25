import { Calendar, Code, BarChart3, ShieldCheck, Zap, Users } from "lucide-react"

const features = [
    {
        icon: Calendar,
        title: "AI Scheduling",
        description: "Automate scheduling with candidates. No more back-and-forth emails."
    },
    {
        icon: Code,
        title: "Auto-Technical Interviews",
        description: "Conduct initial technical screenings with our AI interviewer."
    },
    {
        icon: BarChart3,
        title: "Instant Scoring",
        description: "Get objective scores and detailed feedback immediately after interviews."
    },
    {
        icon: ShieldCheck,
        title: "Bias-Free Evaluation",
        description: "Fair candidate assessment using standardized AI-driven rubrics."
    },
    {
        icon: Users,
        title: "Collaborative Hiring",
        description: "Share reports and recordings with your team in one click."
    },
    {
        icon: Zap,
        title: "Seamless Integration",
        description: "Connects with your existing ATS, Slack, and Calendars."
    }
]

export function Features() {
    return (
        <section className="py-24 bg-white" id="features">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-4">
                        Everything you need to hire top talent
                    </h2>
                    <p className="text-lg text-slate-600">
                        A powerful suite of AI tools designed to streamline every stage of your recruitment process.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <div key={index} className="p-6 rounded-2xl border border-black/5 bg-white shadow-sm hover:shadow-md transition-all">
                            <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                                <feature.icon className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="text-xl font-semibold text-slate-900 mb-2">{feature.title}</h3>
                            <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
