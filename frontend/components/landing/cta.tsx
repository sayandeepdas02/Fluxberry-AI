import Link from "next/link"
import { Button } from "@/components/ui/button"

export function CTA() {
    return (
        <section className="py-24 bg-primary text-white text-center">
            <div className="container mx-auto px-4">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6 max-w-3xl mx-auto">
                    Ready to transform your hiring process?
                </h2>
                <p className="text-lg text-white/80 mb-10 max-w-2xl mx-auto">
                    Join 1,000+ companies hiring the best talent with Interview AI. Start your free 14-day trial today.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <Link href="/dashboard">
                        <Button size="lg" variant="secondary" className="h-12 px-8 text-primary font-semibold">
                            Start Free Trial
                        </Button>
                    </Link>
                    <Button size="lg" variant="outline" className="h-12 px-8 bg-transparent text-white border-white hover:bg-white/10 hover:text-white">
                        Book a Demo
                    </Button>
                </div>
            </div>
        </section>
    )
}
