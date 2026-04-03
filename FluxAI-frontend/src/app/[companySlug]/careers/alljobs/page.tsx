"use client"

import { use, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Briefcase, MapPin, Building, ArrowLeft, ArrowRight, Loader2 } from "lucide-react"
import { publicApi, PublicJobCard, PublicCompany } from "@/lib/api/public"

export default function AllJobsPage({ params }: { params: Promise<{ companySlug: string }> }) {
    const { companySlug } = use(params);
    const [company, setCompany] = useState<PublicCompany | null>(null);
    const [jobs, setJobs] = useState<PublicJobCard[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchJobs() {
            setLoading(true);
            try {
                const [companyRes, jobsRes] = await Promise.all([
                    publicApi.getCompany(companySlug),
                    publicApi.getCompanyJobs(companySlug)
                ]);

                if (companyRes.success && companyRes.data) {
                    setCompany(companyRes.data);
                }
                
                if (jobsRes.success && jobsRes.data) {
                    setJobs(jobsRes.data);
                }
            } catch (err) {
                console.error("Failed to fetch public data", err);
            } finally {
                setLoading(false);
            }
        }
        fetchJobs();
    }, [companySlug]);

    // Group jobs by department
    const jobsByDepartment = jobs.reduce((acc, job) => {
        const dept = job.department || "Other";
        if (!acc[dept]) acc[dept] = [];
        acc[dept].push(job);
        return acc;
    }, {} as Record<string, PublicJobCard[]>);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 text-muted-foreground">
                 <Loader2 className="h-8 w-8 animate-spin" />
                 <p>Loading open roles...</p>
            </div>
        );
    }

    if (!company) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
                 <h2 className="text-xl font-medium text-foreground">Company Not Found</h2>
                 <p className="text-muted-foreground">The careers page you are looking for does not exist.</p>
                 <Button asChild><a href="/">Go Home</a></Button>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col bg-background mx-auto w-full border-x border-line max-w-[var(--container-max)] text-foreground selection:bg-foreground/10">
            {/* 1. Header */}
            <header className="sticky top-0 z-50 w-full border-b border-edge bg-background/80 backdrop-blur-sm">
                <div className="container mx-auto max-w-5xl px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-foreground text-background flex items-center justify-center text-lg overflow-hidden">
                            {company.logoUrl ? (
                                <img src={company.logoUrl} alt={company.name} className="w-full h-full object-cover" />
                            ) : (
                                company.name.charAt(0)
                            )}
                        </div>
                        <span className="font-semibold text-lg tracking-tight">{company.name} Careers</span>
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
                        <h1 className="text-3xl md:text-4xl tracking-tight">All Open Positions</h1>
                        <p className="text-lg text-muted-foreground">
                            Explore all current opportunities and find the role that fits you best.
                        </p>
                    </div>

                    {/* Job Listings Grouped by Department */}
                    <div className="space-y-12">
                        {Object.keys(jobsByDepartment).length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                No open positions available at this time.
                            </div>
                        ) : (
                            Object.entries(jobsByDepartment).map(([department, deptJobs]) => (
                                <section key={department} className="space-y-6">
                                    <h2 className="text-2xl font-semibold tracking-tight border-b border-edge pb-2">
                                        {department}
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {deptJobs.map((job) => (
                                            <Card key={job._id} className="group hover:border-foreground/30 transition-colors cursor-pointer border-edge shadow-none border">
                                                <CardContent className="p-6">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div>
                                                            <h3 className="font-semibold text-lg group-hover:underline decoration-1 underline-offset-4">{job.title}</h3>
                                                            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1">
                                                                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {job.location || 'Remote'}</span>
                                                                <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" /> {job.employmentType?.replace(/_/g, ' ') || 'Full-time'}</span>
                                                            </div>
                                                        </div>
                                                        <Button size="sm" variant="outline" className="opacity-0 group-hover:opacity-100 transition-opacity" asChild>
                                                            <a href={`/${companySlug}/careers/${job.publicSlug || job._id}`}>
                                                                Apply
                                                            </a>
                                                        </Button>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 mt-4">
                                                        {(job.requiredSkills || []).slice(0, 5).map((skill) => (
                                                            <Badge key={skill} variant="secondary" className="font-normal text-xs bg-muted text-muted-foreground hover:bg-muted">
                                                                {skill}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </section>
                            ))
                        )}
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
                        <div className="w-6 h-6 rounded bg-foreground text-background flex items-center justify-center text-xs overflow-hidden">
                            {company.logoUrl ? (
                                <img src={company.logoUrl} alt={company.name} className="w-full h-full object-cover" />
                            ) : (
                                company.name.charAt(0)
                            )}
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
