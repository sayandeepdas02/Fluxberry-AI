"use client"

import { PageContainer } from "@/components/dashboard/page-container"
import { useQuery } from "@tanstack/react-query"
import { jobsApi, Job } from "@/lib/api/jobs"
import { apiClient } from "@/lib/api/client"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/dashboard/empty-state"
import { Skeleton } from "@/components/dashboard/skeleton"
import { Globe, Briefcase, ExternalLink, Copy } from "lucide-react"
import { toast } from "sonner"

export default function CareerPageView() {
    const { data: orgRes } = useQuery({
        queryKey: ['organization-career'],
        queryFn: () => apiClient.get<any>('/organization'),
    })

    const { data: jobsRes, isLoading } = useQuery({
        queryKey: ['jobs', 'career-page'],
        queryFn: () => jobsApi.list({ status: 'PUBLISHED', limit: 50 }),
    })

    const org = orgRes?.data
    const jobs = (jobsRes?.data || []) as Job[]
    const careerUrl = org?.slug ? `${typeof window !== 'undefined' ? window.location.origin : ''}/careers/${org.slug}` : null

    return (
        <PageContainer title="Public Career Page" description="View and manage your public-facing career page with open positions.">
            <div className="mt-6 w-full space-y-6">
                {/* Career page link */}
                {careerUrl && (
                    <div className="flex items-center justify-between p-4 border border-accent/20 rounded-lg bg-accent/5">
                        <div className="flex items-center gap-3">
                            <Globe className="w-5 h-5 text-accent" />
                            <div>
                                <p className="text-sm font-medium">Your career page is live</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{careerUrl}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => { navigator.clipboard.writeText(careerUrl); toast.success('Copied!') }}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-line rounded-md hover:bg-muted transition-colors">
                                <Copy className="w-3 h-3" /> Copy
                            </button>
                            <a href={careerUrl} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-accent border border-accent/20 rounded-md hover:bg-accent/10 transition-colors">
                                <ExternalLink className="w-3 h-3" /> Preview
                            </a>
                        </div>
                    </div>
                )}

                {/* Published jobs preview */}
                {isLoading ? (
                    <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
                ) : jobs.length === 0 ? (
                    <EmptyState icon={Briefcase} title="No published jobs" description="Publish jobs to make them visible on your public career page." />
                ) : (
                    <div className="border border-line rounded-lg bg-card/50 p-4 space-y-3">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Published Positions ({jobs.length})</h4>
                        {jobs.map(job => (
                            <div key={job._id} className="flex items-center justify-between p-3 bg-muted/10 rounded-lg">
                                <div>
                                    <p className="text-sm font-medium">{job.title}</p>
                                    <p className="text-[10px] text-muted-foreground">{job.department || '—'} · {job.location || 'Remote'} · {job.employmentType?.replace('_', ' ')}</p>
                                </div>
                                <Badge className="text-[10px] bg-emerald-500/10 text-emerald-400">{job.applicationCount || 0} apps</Badge>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </PageContainer>
    )
}
