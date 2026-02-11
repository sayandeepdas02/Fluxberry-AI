"use client"

import { use } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Briefcase, MapPin, Building, ArrowLeft, ArrowRight } from "lucide-react"

// Mock Data for the company
const companyData = {
    name: "Acme Corp",
    logo: "A",
}

// Mock Job Listings Grouped by Department
const jobsByDepartment = {
    "Engineering": [
        {
            id: "101",
            title: "Senior Propulsion Engineer",
            location: "Los Angeles, CA",
            employmentType: "Full-time",
            tags: ["Thermodynamics", "C++", "Hardware"],
        },
        {
            id: "102",
            title: "Staff Software Engineer, Flight Systems",
            location: "Remote",
            employmentType: "Full-time",
            tags: ["Rust", "Real-time", "Embedded"],
        },
        {
            id: "105",
            title: "Engineering Manager",
            location: "Remote",
            employmentType: "Full-time",
            tags: ["Leadership", "People", "Agile"],
        },
        {
            id: "107",
            title: "Frontend Engineer, Mission Control",
            location: "Los Angeles, CA",
            employmentType: "Full-time",
            tags: ["React", "WebGL", "TypeScript"],
        },
        {
            id: "108",
            title: "Guidance, Navigation & Control Engineer",
            location: "Los Angeles, CA",
            employmentType: "Full-time",
            tags: ["Matlab", "Control Theory", "Simulink"],
        }
    ],
    "Design": [
        {
            id: "103",
            title: "Product Designer, Core Experience",
            location: "New York, NY",
            employmentType: "Full-time",
            tags: ["Figma", "Design Systems", "UX"],
        },
        {
            id: "109",
            title: "Visual Designer",
            location: "Remote",
            employmentType: "Contract",
            tags: ["Brand", "Marketing", "Illustration"],
        }
    ],
    "Product": [
        {
            id: "110",
            title: "Senior Product Manager",
            location: "San Francisco, CA",
            employmentType: "Full-time",
            tags: ["Strategy", "Roadmap", "B2B"],
        }
    ],
    "Marketing": [
        {
            id: "104",
            title: "Marketing Manager",
            location: "Los Angeles, CA",
            employmentType: "Full-time",
            tags: ["Growth", "Campaigns", "Social"],
        }
    ],
    "People": [
        {
            id: "106",
            title: "Recruiting Coordinator",
            location: "Los Angeles, CA",
            employmentType: "Contract",
            tags: ["Scheduling", "Ops"],
        }
    ]
}

export default function AllJobsPage({ params }: { params: Promise<{ companySlug: string }> }) {
    const { companySlug } = use(params);
    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-foreground/10">
            {/* 1. Header */}
            <header className="sticky top-0 z-50 w-full border-b border-edge bg-background/80 backdrop-blur-sm">
                <div className="container mx-auto max-w-5xl px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-foreground text-background flex items-center justify-center font-bold text-lg">
                            {companyData.logo}
                        </div>
                        <span className="font-semibold text-lg tracking-tight">{companyData.name} Careers</span>
                    </div>
                    <Button variant="ghost" size="sm" asChild className="gap-2">
                        <a href={`/${companySlug}/careers`}>
                            <ArrowLeft className="w-4 h-4" /> Back to Careers
                        </a>
                    </Button>
                </div>
            </header>

            <main className="py-16 px-6">
                <div className="container mx-auto max-w-5xl space-y-16">

                    {/* Header Section */}
                    <div className="text-center space-y-4 max-w-2xl mx-auto">
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">All Open Positions</h1>
                        <p className="text-lg text-muted-foreground">
                            Explore all current opportunities and find the role that fits you best.
                        </p>
                    </div>

                    {/* Job Listings Grouped by Department */}
                    <div className="space-y-12">
                        {Object.entries(jobsByDepartment).map(([department, jobs]) => (
                            <section key={department} className="space-y-6">
                                <h2 className="text-2xl font-semibold tracking-tight border-b border-edge pb-2">
                                    {department}
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {jobs.map((job) => (
                                        <Card key={job.id} className="group hover:border-foreground/30 transition-colors cursor-pointer border-edge shadow-none">
                                            <CardContent className="p-6">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h3 className="font-semibold text-lg group-hover:underline decoration-1 underline-offset-4">{job.title}</h3>
                                                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1">
                                                            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {job.location}</span>
                                                            <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" /> {job.employmentType?.replace(/_/g, ' ')}</span>
                                                        </div>
                                                    </div>
                                                    <Button size="sm" variant="outline" className="opacity-0 group-hover:opacity-100 transition-opacity" asChild>
                                                        <a href={`/${companySlug}/careers/${job.id}`}>
                                                            Apply
                                                        </a>
                                                    </Button>
                                                </div>
                                                <div className="flex flex-wrap gap-2 mt-4">
                                                    {job.tags.map(tag => (
                                                        <Badge key={tag} variant="secondary" className="font-normal text-xs bg-muted text-muted-foreground hover:bg-muted">
                                                            {tag}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>

                    {/* Empty State / Bottom CTA */}
                    <div className="pt-8 text-center border-t border-edge">
                        <p className="text-muted-foreground mb-4">Don't see a role that fits?</p>
                        <Button variant="link" className="text-foreground">
                            Join our talent network <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>

                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-edge py-12 bg-muted/10">
                <div className="container mx-auto max-w-5xl px-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2 opacity-50">
                        <div className="w-6 h-6 rounded bg-foreground text-background flex items-center justify-center font-bold text-xs">
                            {companyData.logo}
                        </div>
                        <span className="font-semibold text-sm">{companyData.name} Careers</span>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <a href="#" className="hover:text-foreground transition-colors">About</a>
                        <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
                        <a href="#" className="hover:text-foreground transition-colors">Terms</a>
                    </div>

                    <div className="text-xs text-muted-foreground opacity-50">
                        © 2024 {companyData.name}. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    )
}
