'use client'

import * as React from 'react'
import Link from 'next/link'
import {
    Search, MapPin, Briefcase, Clock, ChevronRight,
    Building2, Filter, X, Sparkles, Loader2
} from 'lucide-react'
import { publicApi, type PublicJobCard, type PublicJobListQuery } from '@/lib/api/public'

// ──────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────

const EMPLOYMENT_TYPES = [
    { value: '',           label: 'Any type'   },
    { value: 'FULL_TIME',  label: 'Full-time'  },
    { value: 'PART_TIME',  label: 'Part-time'  },
    { value: 'CONTRACT',   label: 'Contract'   },
    { value: 'INTERN',     label: 'Internship' },
]

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

// ──────────────────────────────────────────────────────────────
// Job Card
// ──────────────────────────────────────────────────────────────

function JobCard({ job }: { job: PublicJobCard }) {
    const company = job.company
    const skills  = job.requiredSkills?.slice(0, 3) ?? []

    return (
        <Link
            href={`/jobs/${job.publicSlug}`}
            className="group block border border-border bg-background hover:border-primary/40 hover:bg-primary/[0.02] transition-all duration-200 p-5"
        >
            <div className="flex items-start gap-4">
                {/* Company logo */}
                <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-muted/30 border border-border flex items-center justify-center overflow-hidden">
                    {company?.logoUrl ? (
                        <img src={company.logoUrl} alt={company.name} className="w-full h-full object-contain p-1" />
                    ) : (
                        <Building2 className="w-5 h-5 text-muted-foreground/40" />
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    {/* Title row */}
                    <div className="flex items-start justify-between gap-3 mb-1">
                        <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-tight line-clamp-1">
                            {job.title}
                        </h3>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary flex-shrink-0 mt-0.5 transition-colors" />
                    </div>

                    {/* Company name */}
                    {company?.name && (
                        <p className="text-xs text-muted-foreground mb-2">{company.name}</p>
                    )}

                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground mb-3">
                        {job.location && (
                            <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {job.location}
                            </span>
                        )}
                        {job.employmentType && (
                            <span className="flex items-center gap-1">
                                <Briefcase className="w-3 h-3" />
                                {EMP_LABEL[job.employmentType] ?? job.employmentType}
                            </span>
                        )}
                        {job.experienceRange && (
                            <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {job.experienceRange.min}–{job.experienceRange.max}y exp
                            </span>
                        )}
                        {job.publishedAt && (
                            <span className="ml-auto">{timeAgo(job.publishedAt)}</span>
                        )}
                    </div>

                    {/* Skills */}
                    {skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {skills.map(s => (
                                <span key={s} className="text-[10px] px-2 py-0.5 rounded-sm bg-muted/60 text-muted-foreground border border-border">
                                    {s}
                                </span>
                            ))}
                            {(job.requiredSkills?.length ?? 0) > 3 && (
                                <span className="text-[10px] px-2 py-0.5 text-muted-foreground/60">
                                    +{(job.requiredSkills?.length ?? 0) - 3} more
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Link>
    )
}

// ──────────────────────────────────────────────────────────────
// Skeleton loader
// ──────────────────────────────────────────────────────────────

function JobCardSkeleton() {
    return (
        <div className="border border-border bg-background p-5 animate-pulse">
            <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-lg bg-muted/50 flex-shrink-0" />
                <div className="flex-1 space-y-2.5">
                    <div className="h-4 bg-muted/50 rounded w-2/3" />
                    <div className="h-3 bg-muted/40 rounded w-1/3" />
                    <div className="flex gap-3">
                        <div className="h-3 bg-muted/30 rounded w-20" />
                        <div className="h-3 bg-muted/30 rounded w-16" />
                    </div>
                    <div className="flex gap-1.5">
                        <div className="h-4 bg-muted/30 rounded w-14" />
                        <div className="h-4 bg-muted/30 rounded w-20" />
                        <div className="h-4 bg-muted/30 rounded w-16" />
                    </div>
                </div>
            </div>
        </div>
    )
}

// ──────────────────────────────────────────────────────────────
// Main page
// ──────────────────────────────────────────────────────────────

export default function PublicJobsPage() {
    const [jobs,       setJobs]       = React.useState<PublicJobCard[]>([])
    const [total,      setTotal]      = React.useState(0)
    const [totalPages, setTotalPages] = React.useState(1)
    const [page,       setPage]       = React.useState(1)
    const [loading,    setLoading]    = React.useState(true)
    const [loadingMore,setLoadingMore]= React.useState(false)
    const [error,      setError]      = React.useState<string | null>(null)

    // Filters
    const [search,     setSearch]     = React.useState('')
    const [empType,    setEmpType]    = React.useState('')
    const [remoteOnly, setRemoteOnly] = React.useState(false)
    const [showFilters,setShowFilters]= React.useState(false)

    const searchTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
    const sentinelRef = React.useRef<HTMLDivElement | null>(null)

    const buildQuery = React.useCallback((pg: number): PublicJobListQuery => ({
        search:         search         || undefined,
        employmentType: empType        || undefined,
        remote:         remoteOnly     || undefined,
        page:           pg,
        limit:          20,
    }), [search, empType, remoteOnly])

    const fetchJobs = React.useCallback(async (pg: number, append = false) => {
        if (pg === 1) setLoading(true); else setLoadingMore(true)
        setError(null)
        try {
            const res = await publicApi.listJobs(buildQuery(pg))
            if (res.success && res.data) {
                setJobs(prev => append ? [...prev, ...res.data!.jobs] : res.data!.jobs)
                setTotal(res.data.total)
                setTotalPages(res.data.totalPages)
                setPage(pg)
            }
        } catch {
            setError('Failed to load jobs. Please try again.')
        } finally {
            setLoading(false)
            setLoadingMore(false)
        }
    }, [buildQuery])

    // Initial + filter-driven fetch
    React.useEffect(() => {
        setJobs([])
        setPage(1)
        fetchJobs(1, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, empType, remoteOnly])

    // Infinite scroll via IntersectionObserver
    React.useEffect(() => {
        if (!sentinelRef.current) return
        const observer = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && !loadingMore && !loading && page < totalPages) {
                fetchJobs(page + 1, true)
            }
        }, { threshold: 0.1 })
        observer.observe(sentinelRef.current)
        return () => observer.disconnect()
    }, [fetchJobs, loadingMore, loading, page, totalPages])

    // Debounced search
    const handleSearchChange = (val: string) => {
        setSearch(val)
        if (searchTimer.current) clearTimeout(searchTimer.current)
        searchTimer.current = setTimeout(() => {}, 0) // input driven by state already
    }

    const activeFilterCount = [empType, remoteOnly].filter(Boolean).length

    return (
        <div className="min-h-screen bg-background">
            {/* Hero */}
            <div className="border-b border-border bg-muted/20">
                <div className="max-w-4xl mx-auto px-6 py-14 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-xs text-primary font-medium mb-5">
                        <Sparkles className="w-3 h-3" />
                        AI-Screened Positions
                    </div>
                    <h1 className="text-4xl text-foreground mb-3 tracking-tight">
                        Find Your Next Role
                    </h1>
                    <p className="text-muted-foreground text-base max-w-md mx-auto mb-8">
                        Browse open positions. Every application is reviewed by AI to match you with the right team.
                    </p>

                    {/* Search bar */}
                    <div className="relative max-w-xl mx-auto">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search by title, skill, or company..."
                            className="w-full h-12 pl-11 pr-4 text-sm border border-input bg-background text-foreground rounded-none placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                        />
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-8">
                {/* Filter bar */}
                <div className="flex items-center gap-3 mb-6">
                    <button
                        type="button"
                        onClick={() => setShowFilters(f => !f)}
                        className={[
                            'inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium border transition-all rounded-none',
                            showFilters || activeFilterCount > 0
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-border text-muted-foreground hover:border-primary/40',
                        ].join(' ')}
                    >
                        <Filter className="w-3.5 h-3.5" />
                        Filters
                        {activeFilterCount > 0 && (
                            <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
                                {activeFilterCount}
                            </span>
                        )}
                    </button>

                    {/* Active filter chips */}
                    {empType && (
                        <button
                            type="button"
                            onClick={() => setEmpType('')}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs border border-primary/20 bg-primary/5 text-primary rounded-none"
                        >
                            {EMP_LABEL[empType] ?? empType}
                            <X className="w-3 h-3" />
                        </button>
                    )}
                    {remoteOnly && (
                        <button
                            type="button"
                            onClick={() => setRemoteOnly(false)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs border border-primary/20 bg-primary/5 text-primary rounded-none"
                        >
                            Remote only
                            <X className="w-3 h-3" />
                        </button>
                    )}

                    {/* Job count */}
                    <span className="ml-auto text-xs text-muted-foreground">
                        {loading ? '—' : `${total.toLocaleString()} position${total !== 1 ? 's' : ''}`}
                    </span>
                </div>

                {/* Filter panel */}
                {showFilters && (
                    <div className="mb-6 border border-border bg-muted/10 p-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                        <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Employment Type</label>
                            <select
                                value={empType}
                                onChange={e => setEmpType(e.target.value)}
                                className="w-full h-9 px-2.5 text-sm border border-input bg-background text-foreground rounded-none focus:outline-none focus:ring-1 focus:ring-ring"
                            >
                                {EMPLOYMENT_TYPES.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Work Arrangement</label>
                            <button
                                type="button"
                                onClick={() => setRemoteOnly(r => !r)}
                                className={[
                                    'w-full h-9 px-2.5 text-sm border rounded-none text-left transition-all',
                                    remoteOnly
                                        ? 'border-primary bg-primary/5 text-primary'
                                        : 'border-input text-foreground hover:border-primary/40',
                                ].join(' ')}
                            >
                                {remoteOnly ? '✓ Remote only' : 'Include remote'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Job list */}
                {loading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 6 }).map((_, i) => <JobCardSkeleton key={i} />)}
                    </div>
                ) : error ? (
                    <div className="text-center py-16 text-sm text-muted-foreground border border-border">
                        {error}
                        <button
                            type="button"
                            onClick={() => fetchJobs(1)}
                            className="block mx-auto mt-3 text-primary hover:underline"
                        >
                            Retry
                        </button>
                    </div>
                ) : jobs.length === 0 ? (
                    <div className="text-center py-20 border border-border text-muted-foreground">
                        <Search className="w-10 h-10 mx-auto mb-4 opacity-20" />
                        <p className="font-medium text-foreground mb-1">No positions found</p>
                        <p className="text-sm">Try adjusting your search or filters.</p>
                        {(search || empType || remoteOnly) && (
                            <button
                                type="button"
                                onClick={() => { setSearch(''); setEmpType(''); setRemoteOnly(false) }}
                                className="mt-4 text-sm text-primary hover:underline"
                            >
                                Clear all filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {jobs.map(job => (
                            <JobCard key={String(job._id)} job={job} />
                        ))}

                        {/* Infinite scroll sentinel */}
                        <div ref={sentinelRef} className="h-4" />

                        {loadingMore && (
                            <div className="flex items-center justify-center py-6 text-sm text-muted-foreground gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Loading more...
                            </div>
                        )}

                        {!loadingMore && page >= totalPages && jobs.length > 0 && (
                            <p className="text-center text-xs text-muted-foreground py-6">
                                All {total} positions shown
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
