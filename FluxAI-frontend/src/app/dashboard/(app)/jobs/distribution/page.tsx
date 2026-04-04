"use client"

import { PageContainer } from "@/components/dashboard/page-container"
import { useQuery } from "@tanstack/react-query"
import { jobsApi, Job } from "@/lib/api/jobs"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/dashboard/empty-state"
import { Skeleton } from "@/components/dashboard/skeleton"
import { Share2, Globe, ExternalLink, Copy } from "lucide-react"
import { toast } from "sonner"

export default function DistributionPage() {
    const { data: response, isLoading } = useQuery({
        queryKey: ['jobs', 'published-distribution'],
        queryFn: () => jobsApi.list({ status: 'PUBLISHED', limit: 50 }),
    })

    const jobs = (response?.data || []) as Job[]

    const copyLink = (slug: string) => {
        navigator.clipboard.writeText(`${window.location.origin}/careers/${slug}`)
        toast.success('Link copied to clipboard')
    }

    return (
        <PageContainer title="Distribution" description="Distribute your jobs across channels and share public links.">
            <div className="mt-6 w-full space-y-6">
                {isLoading && (
                    <div className="space-y-3">
                        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
                    </div>
                )}

                {!isLoading && jobs.length === 0 && (
                    <EmptyState
                        icon={Share2}
                        title="No published jobs to distribute"
                        description="Publish your jobs first, then you can share them across channels."
                    />
                )}

                {!isLoading && jobs.length > 0 && (
                    <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">{jobs.length} published job{jobs.length !== 1 ? 's' : ''} ready for distribution</p>
                        {jobs.map(job => (
                            <div key={job._id} className="flex items-center justify-between p-4 border border-line rounded-lg bg-card/50 hover:bg-card/80 transition-colors">
                                <div>
                                    <p className="text-sm font-medium">{job.title}</p>
                                    <p className="text-[11px] text-muted-foreground">{job.department || '—'} · {job.location || 'Remote'}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge className="text-[10px] bg-emerald-500/10 text-emerald-400">Published</Badge>
                                    {job.publicSlug && (
                                        <>
                                            <button
                                                onClick={() => copyLink(job.publicSlug!)}
                                                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium border border-line rounded-md hover:bg-muted transition-colors"
                                            >
                                                <Copy className="w-3 h-3" /> Copy Link
                                            </button>
                                            <a
                                                href={`/careers/${job.publicSlug}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-accent border border-accent/20 rounded-md hover:bg-accent/10 transition-colors"
                                            >
                                                <ExternalLink className="w-3 h-3" /> View
                                            </a>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </PageContainer>
    )
}
