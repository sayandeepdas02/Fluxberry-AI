"use client"

import { use } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Briefcase, MapPin, Building, Search, ArrowRight, Quote } from "lucide-react"
import { usePublicCompany } from "@/features/public/hooks/use-public-company"

// Mock Testimonials (Keep for now as we don't have this in DB)
const testimonials = [
    {
        id: 1,
        name: "Elena Rodriguez",
        role: "Senior Propulsion Engineer",
        quote: "The autonomy and trust given to engineers here is unlike anywhere else. You're building things that actually fly to space.",
    },
    {
        id: 2,
        name: "David Park",
        role: "Product Manager",
        quote: "Moves fast. The culture is intense but incredibly rewarding. Best work of my life.",
    },
    {
        id: 3,
        name: "Sarah Jenkins",
        role: "Head of Design",
        quote: "We obsess over every detail. It's not just about function; it's about crafting an experience for the future.",
    },
]

export default function CareersPage({ params }: { params: Promise<{ companySlug: string }> }) {
    const { companySlug } = use(params)
    const { company, jobs, isLoading, error } = usePublicCompany(companySlug)

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-background text-foreground">Loading career page...</div>
    }

    if (error || !company) {
        return <div className="min-h-screen flex items-center justify-center bg-background text-destructive">Company not found or error loading page.</div>
    }

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-foreground/10">
            {/* 1. Navigation / Header */}
            <header className="sticky top-0 z-50 w-full border-b border-edge bg-background/80 backdrop-blur-sm">
                <div className="container mx-auto max-w-5xl px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-foreground text-background flex items-center justify-center font-bold text-lg overflow-hidden">
                            {company.logoUrl ? <img src={company.logoUrl} alt={company.name} className="w-full h-full object-cover" /> : company.name[0]}
                        </div>
                        <span className="font-semibold text-lg tracking-tight">{company.name}</span>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                        <a href="#open-roles">View Roles</a>
                    </Button>
                </div>
            </header>

            <main>
                {/* 2. Hero Section */}
                <section className="relative py-24 lg:py-32 px-6 flex flex-col items-center text-center">
                    <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-100/50 via-background to-background dark:from-zinc-900/20" />

                    <div className="max-w-3xl space-y-6">
                        <Badge variant="secondary" className="px-3 py-1 text-sm font-medium rounded-full mb-4">
                            We are hiring
                        </Badge>
                        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
                            Join {company.name}
                        </h1>
                        <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                            We are building the future. Join our team and help us make an impact.
                        </p>
                        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Button size="lg" className="h-12 px-8 text-base rounded-full" asChild>
                                <a href="#open-roles">
                                    View Open Positions
                                </a>
                            </Button>
                        </div>
                    </div>
                </section>

                {/* 3. Social Proof / Testimonials */}
                <section className="py-20 px-6 border-y border-edge bg-muted/30">
                    <div className="container mx-auto max-w-5xl">
                        <div className="text-center mb-12">
                            <h2 className="text-2xl font-semibold tracking-tight">What our team says</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {testimonials.map((t) => (
                                <Card key={t.id} className="bg-background border-edge shadow-sm">
                                    <CardContent className="p-6 space-y-4">
                                        <Quote className="w-8 h-8 text-muted-foreground/20" />
                                        <p className="text-muted-foreground italic leading-relaxed">
                                            "{t.quote}"
                                        </p>
                                        <div className="flex items-center gap-3 pt-2">
                                            <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-sm font-bold text-zinc-500">
                                                {t.name[0]}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-foreground">{t.name}</div>
                                                <div className="text-xs text-muted-foreground">{t.role}</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 4. Open Positions */}
                <section id="open-roles" className="py-24 px-6">
                    <div className="container mx-auto max-w-5xl space-y-12">
                        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
                            <div>
                                <h2 className="text-3xl font-bold tracking-tight mb-2">Open Positions</h2>
                                <p className="text-muted-foreground">Join us in building the future.</p>
                            </div>

                            {/* Simple Filters Placeholder */}
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        placeholder="Search roles..."
                                        className="h-10 pl-9 pr-4 rounded-md border border-input bg-background text-sm focus:ring-2 focus:ring-ring focus:outline-none w-[200px]"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {jobs.length === 0 ? (
                                <div className="col-span-2 text-center py-12 text-muted-foreground">
                                    No open positions at the moment.
                                </div>
                            ) : (
                                jobs.map((job) => (
                                    <Card key={job._id} className="group hover:border-foreground/30 transition-colors cursor-pointer border-edge shadow-none">
                                        <CardContent className="p-6">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="font-semibold text-lg group-hover:underline decoration-1 underline-offset-4">{job.title}</h3>
                                                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1">
                                                        {job.department && <span className="flex items-center gap-1"><Building className="w-3.5 h-3.5" /> {job.department}</span>}
                                                        {job.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {job.location}</span>}
                                                        {job.employmentType && <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" /> {job.employmentType.replace(/_/g, ' ')}</span>}
                                                    </div>
                                                </div>
                                                <Button size="sm" variant="secondary" className="opacity-0 group-hover:opacity-100 transition-opacity" asChild>
                                                    <a href={`/${companySlug}/careers/${job._id}`}>
                                                        Apply
                                                    </a>
                                                </Button>
                                            </div>
                                            <div className="flex flex-wrap gap-2 mt-4">
                                                {/* Tags not in DB yet, using placeholder or derived */}
                                                <Badge variant="secondary" className="font-normal text-xs bg-muted text-muted-foreground hover:bg-muted">
                                                    New
                                                </Badge>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </div>
                </section>

                {/* 5. Employer Branding CTA */}
                <section className="py-20 px-6">
                    <div className="container mx-auto max-w-4xl">
                        <div className="rounded-2xl bg-zinc-950 text-white p-8 md:p-12 text-center space-y-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-800 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-20 pointer-events-none" />

                            <h2 className="text-3xl font-bold tracking-tight">Experience better hiring.</h2>
                            <p className="text-zinc-400 max-w-lg mx-auto text-lg">
                                We use Fluxberry AI to ensure a fair, fast, and transparent interview process for every candidate.
                            </p>

                            <ul className="flex flex-wrap justify-center gap-4 md:gap-8 text-sm text-zinc-300 py-4">
                                <li className="flex items-center gap-2">✓ AI-Assisted Scheduling</li>
                                <li className="flex items-center gap-2">✓ Bias-Free Screening</li>
                                <li className="flex items-center gap-2">✓ Quick Feedback</li>
                            </ul>

                            <Button className="bg-white text-black hover:bg-white/90 font-medium h-11 px-8 rounded-full">
                                <a href="#open-roles">
                                    View all jobs
                                </a>

                            </Button>

                            <div className="pt-8 text-xs text-zinc-600">
                                Powered by <span className="font-bold text-zinc-500">Fluxberry AI</span>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* 6. Footer */}
            <footer className="border-t border-edge py-12 bg-muted/10">
                <div className="container mx-auto max-w-5xl px-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2 opacity-50">
                        <div className="w-6 h-6 rounded bg-foreground text-background flex items-center justify-center font-bold text-xs overflow-hidden">
                            {company.logoUrl ? <img src={company.logoUrl} alt={company.name} className="w-full h-full object-cover" /> : company.name[0]}
                        </div>
                        <span className="font-semibold text-sm">{company.name} Careers</span>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <a href="#" className="hover:text-foreground transition-colors">About</a>
                        <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
                        <a href="#" className="hover:text-foreground transition-colors">Terms</a>
                    </div>

                    <div className="text-xs text-muted-foreground opacity-50">
                        © {new Date().getFullYear()} {company.name}. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    )
}
