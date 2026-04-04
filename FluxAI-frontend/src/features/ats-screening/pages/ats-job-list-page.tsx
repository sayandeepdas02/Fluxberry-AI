"use client"

import useSWR from "swr"
import { jobsApi, Job } from "@/lib/api/jobs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Users } from "lucide-react"
import Link from "next/link"

export function AtsJobListPage() {
    const { data: jobsResponse, isLoading } = useSWR('jobs-published', () => jobsApi.list({ status: 'PUBLISHED' }))

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading active jobs...</div>
    }

    const jobs = jobsResponse?.data || []

    return (
        <div className="p-8 space-y-6 max-w-7xl mx-auto pb-24">
            <div>
                <h1 className="text-3xl tracking-tight">ATS Screening</h1>
                <p className="text-muted-foreground mt-1">
                    AI-driven candidate intelligence and ranking. Select a job to view match analytics.
                </p>
            </div>

            {jobs.length === 0 ? (
                <Card className="p-12 border-dashed flex flex-col items-center justify-center space-y-4">
                    <div className="text-center space-y-2">
                        <h3 className="text-xl font-semibold tracking-tight text-foreground">No Active Screening Jobs</h3>
                        <p className="text-muted-foreground">
                            Publish a job inside Job Board to activate AI screening intelligence.
                        </p>
                    </div>
                    <Button asChild>
                        <Link href="/dashboard/manage-jobs">
                            Go to Job Board
                        </Link>
                    </Button>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {jobs.map((job: Job) => (
                        <Card key={job._id} className="hover:border-primary/50 transition-colors flex flex-col">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <CardTitle className="leading-tight">{job.title}</CardTitle>
                                    <Badge variant="secondary" className="bg-primary/10 text-primary">Active</Badge>
                                </div>
                                <CardDescription className="line-clamp-2 mt-2 break-words text-sm">
                                    {job.department ? `${job.department} • ` : ''}{job.location || 'Remote'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="mt-auto pt-4 flex items-center justify-between border-t border-border/50">
                                <div className="flex items-center text-muted-foreground text-sm font-medium">
                                    <Users className="w-4 h-4 mr-2" />
                                    {job.applicationCount || 0} Applicants
                                </div>
                                <Button asChild size="sm">
                                    <Link href={`/dashboard/ats-screening/${job._id}`}>
                                        View Screening <ArrowRight className="w-4 h-4 ml-2" />
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
