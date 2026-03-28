'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Briefcase, Search } from 'lucide-react'
import { useJobs } from '../hooks/use-jobs'
import { JobCard } from './job-card'

type StatusFilter = 'ALL' | 'DRAFT' | 'PUBLISHED' | 'CLOSED'

export function ManageJobsView() {
    const router = useRouter()
    const [activeFilter, setActiveFilter] = React.useState<StatusFilter>('ALL')
    const { jobs, loading, error, fetchJobs, publishJob, closeJob, deleteJob } = useJobs()

    const filteredJobs = activeFilter === 'ALL'
        ? jobs
        : jobs.filter(j => j.status === activeFilter)

    const handlePublish = async (id: string) => {
        await publishJob(id)
    }

    const handleClose = async (id: string) => {
        await closeJob(id)
    }

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this job?')) {
            await deleteJob(id)
        }
    }

    const handleEdit = (id: string) => {
        router.push(`/dashboard/manage-jobs/${id}/edit`)
    }

    const handleClick = (id: string) => {
        router.push(`/dashboard/manage-jobs/${id}`)
    }

    const FILTERS: { label: string; value: StatusFilter; count?: number }[] = [
        { label: 'All', value: 'ALL', count: jobs.length },
        { label: 'Draft', value: 'DRAFT', count: jobs.filter(j => j.status === 'DRAFT').length },
        { label: 'Published', value: 'PUBLISHED', count: jobs.filter(j => j.status === 'PUBLISHED').length },
        { label: 'Closed', value: 'CLOSED', count: jobs.filter(j => j.status === 'CLOSED').length },
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-foreground font-mono uppercase tracking-widest">Manage Jobs</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Create and manage job postings for your organization
                    </p>
                </div>
                <button
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-none bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-none"
                    onClick={() => router.push('/dashboard/manage-jobs/new')}
                >
                    <Plus className="w-4 h-4" />
                    New Job Post
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="border-b border-line">
                <div className="flex items-center gap-6">
                    {FILTERS.map((filter) => (
                        <button
                            key={filter.value}
                            onClick={() => setActiveFilter(filter.value)}
                            className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeFilter === filter.value
                                    ? 'border-foreground text-foreground'
                                    : 'border-transparent text-muted-foreground hover:text-foreground/70'
                                }`}
                        >
                            {filter.label}
                            {filter.count !== undefined && filter.count > 0 && (
                                <span className="ml-1.5 text-[10px] text-muted-foreground/60">
                                    ({filter.count})
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            {loading && (
                <div className="flex items-center justify-center py-20">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
                        Loading jobs...
                    </div>
                </div>
            )}

            {error && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-500">
                    {error}
                </div>
            )}

            {!loading && !error && filteredJobs.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Briefcase className="w-10 h-10 text-muted-foreground/30 mb-4" />
                    <h3 className="text-sm font-medium text-foreground">
                        {activeFilter === 'ALL' ? 'No jobs yet' : `No ${activeFilter.toLowerCase()} jobs`}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                        Create your first job posting to get started
                    </p>
                </div>
            )}

            {!loading && !error && filteredJobs.length > 0 && (
                <div className="space-y-3">
                    {filteredJobs.map((job) => (
                        <JobCard
                            key={job._id}
                            job={job}
                            onPublish={handlePublish}
                            onClose={handleClose}
                            onDelete={handleDelete}
                            onEdit={handleEdit}
                            onClick={handleClick}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
