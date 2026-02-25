import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight, PlayCircle } from "lucide-react"

export function Hero() {
    return (
        <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden bg-gradient-to-b from-slate-50 to-white">
            <div className="container mx-auto px-4 text-center">
                <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary hover:bg-primary/20 mb-8">
                    New: AI-Powered Resume Scoring
                </div>

                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 mb-6 max-w-4xl mx-auto">
                    Automate Interviews. <br className="hidden md:block" />
                    <span className="text-primary">Hire Faster.</span> Zero Bias.
                </h1>

                <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                    Streamline your hiring process with AI-driven screening, automated technical interviews,
                    and bias-free candidate scoring. Perfect for startups and enterprise recruiting teams.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                    <Link href="/register">
                        <Button size="lg" className="h-12 px-8 text-base shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all">
                            Start Hiring Smarter
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                    <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                        <PlayCircle className="mr-2 h-4 w-4" />
                        Watch Demo
                    </Button>
                </div>

                <div className="relative mx-auto max-w-5xl rounded-2xl border border-black/5 bg-white shadow-2xl overflow-hidden ring-1 ring-black/5">
                    <Image
                        src="/hero-dashboard-v2.png"
                        alt="Interview AI Dashboard Interface"
                        width={1024}
                        height={685}
                        className="w-full h-auto"
                        priority
                    />
                </div>
            </div>
        </section>
    )
}
