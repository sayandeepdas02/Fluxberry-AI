'use client'

import * as React from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
    Building2, Globe, MapPin, Briefcase, Clock, ChevronRight,
    AlertCircle, ArrowLeft
} from 'lucide-react'
import { publicApi, type PublicCompany, type PublicJob } from '@/lib/api/public'

const EMP_LABEL: Record<string, string> = {
    FULL_TIME: 'Full-time', PART_TIME: 'Part-time',
    CONTRACT: 'Contract', INTERN: 'Internship', OTHER: 'Other',
}

function timeAgo(iso?: string): string {
    if (!iso) return ''
    const diff = Date.now() - new Date(iso).getTime()
    const d = Math.floor(diff / 86400000)
    if (d === 0) return 'Today'
    if (d === 1) return 'Yesterday'
    if (d < 7)  return `${d} days ago`
    if (d < 30) return `${Math.floor(d / 7)}w ago`
    return `${Math.floor(d / 30)}mo ago`
}

function JobCard({ job }: { job: PublicJob }) {
    const skills = job.requiredSkills?.slice(0, 3) ?? []
    return (
        <Link
            href={`/jobs/${job.publicSlug}`}
            className="group block border border-border bg-background hover:border-primary/40 hover:bg-primary/[0.02] transition-all p-5"
        >
            <div className="flex items-start justify-between gap-3 mb-1">
                <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    {job.title}
                </h3>
                <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary flex-shrink-0 mt-0.5 transition-colors" />
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground mb-3">
                {job.location && (
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
                )}
                {job.employmentType && (
                    <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{EMP_LABEL[job.employmentType] ?? job.employmentType}</span>
                )}
                {job.experienceRange && (
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{job.experienceRange.min}–{job.experienceRange.max}y</span>
                )}
                {job.publishedAt && (
                    <span className="ml-auto">{timeAgo(job.publishedAt)}</span>
                )}
            </div>
            {skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {skills.map(s => (
                        <span key={s} className="text-[10px] px-2 py-0.5 rounded-sm bg-muted/60 text-muted-foreground border border-border">{s}</span>
                    ))}
                    {(job.requiredSkills?.length ?? 0) > 3 && (
                        <span className="text-[10px] px-1.5 text-muted-foreground/60">+{(job.requiredSkills?.length ?? 0) - 3}</span>
                    )}
                </div>
            )}
        </Link>
    )
}

export default function CompanyPage() {
    const params  = useParams()
    const slug    = params.slug as string

    const [company, setCompany] = React.useState<PublicCompany | null>(null)
    const [jobs,    setJobs]    = React.useState<PublicJob[]>([])
    const [loading, setLoading] = React.useState(true)
    const [error,   setError]   = React.useState<string | null>(null)

    React.useEffect(() => {
        if (!slug) return
        async function load() {
            setLoading(true)
            try {
                const [compRes, jobsRes] = await Promise.all([
                    publicApi.getCompany(slug),
                    publicApi.getCompanyJobs(slug),
                ])
                if (compRes.success && compRes.data) setCompany(compRes.data)
                if (jobsRes.success && jobsRes.data) setJobs(jobsRes.data as PublicJob[])
            } catch {
                setError('Company not found')
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [slug])

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
                    Loading...
                </div>
            </div>
        )
    }

    if (error || !company) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <h1 className="text-lg font-medium text-foreground mb-2">Company Not Found</h1>
                    <p className="text-sm text-muted-foreground mb-6">This company page doesn&apos;t exist or has been removed.</p>
                    <Link href="/jobs" className="text-sm text-primary hover:underline">Browse all jobs</Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Company header */}
            <div className="border-b border-border bg-muted/10">
                <div className="max-w-3xl mx-auto px-6 py-12">
                    <Link
                        href="/jobs"
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-8"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        All jobs
                    </Link>

                    <div className="flex items-start gap-5">
                        <div className="w-16 h-16 rounded-xl border border-border bg-background flex items-center justify-center overflow-hidden flex-shrink-0">
                            {company.logoUrl ? (
                                <img src={company.logoUrl} alt={company.name} className="w-full h-full object-contain p-1.5" />
                            ) : (
                                <Building2 className="w-8 h-8 text-muted-foreground/30" />
                            )}
                        </div>
                        <div>
                            <h1 className="text-2xl text-foreground mb-1">{company.name}</h1>
                            {company.website && (
                                <a
                                    href={company.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                                >
                                    <Globe className="w-3 h-3" />
                                    {company.website.replace(/^https?:\/\//, '')}
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Jobs */}
            <div className="max-w-3xl mx-auto px-6 py-8">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-sm font-semibold text-foreground">
                        Open Positions
                    </h2>
                    <span className="text-xs text-muted-foreground">
                        {jobs.length} role{jobs.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {jobs.length === 0 ? (
                    <div className="border border-border py-16 text-center text-muted-foreground">
                        <Briefcase className="w-10 h-10 mx-auto mb-4 opacity-20" />
                        <p className="font-medium text-foreground mb-1">No open positions</p>
                        <p className="text-sm">Check back later for new roles.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {jobs.map(job => <JobCard key={String(job._id)} job={job} />)}
                    </div>
                )}
            </div>
        </div>
    )
}
