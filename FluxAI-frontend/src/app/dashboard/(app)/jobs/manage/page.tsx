"use client"

import { PageContainer } from "@/components/dashboard/page-container"
import { useQuery } from "@tanstack/react-query"
import { useApiMutation } from "@/lib/hooks/use-api-mutation"
import { jobsApi, Job } from "@/lib/api/jobs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { EmptyState } from "@/components/dashboard/empty-state"
import { Skeleton } from "@/components/dashboard/skeleton"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Briefcase, Plus, Search, Globe, Lock, Eye, Archive,
    ArchiveRestore, Copy, RefreshCw, MoreHorizontal, Trash2,
} from "lucide-react"
import { useState } from "react"
import { format } from "date-fns"
import { useRouter } from "next/navigation"

const STATUS_STYLES: Record<string, { label: string; class: string }> = {
    DRAFT:     { label: 'Draft',     class: 'bg-muted text-muted-foreground' },
    PUBLISHED: { label: 'Published', class: 'bg-emerald-500/10 text-emerald-400' },
    CLOSED:    { label: 'Closed',    class: 'bg-red-500/10 text-red-400' },
}

const VISIBILITY_ICONS: Record<string, React.ReactNode> = {
    PUBLIC:      <Globe className="w-3 h-3 text-emerald-400" />,
    PRIVATE:     <Lock className="w-3 h-3 text-amber-400" />,
    INVITE_ONLY: <Eye className="w-3 h-3 text-blue-400" />,
}

export default function ManageJobsPage() {
    const router = useRouter()
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [showArchived, setShowArchived] = useState(false)
    const [page, setPage] = useState(1)

    const { data: response, isLoading } = useQuery({
        queryKey: ['jobs', page, statusFilter, search, showArchived],
        queryFn: () => jobsApi.list({
            page, limit: 20,
            status: (statusFilter || undefined) as any,
            search: search || undefined,
            archived: showArchived,
        }),
    })

    const jobs = (response?.data || []) as Job[]
    const total = (response as any)?.meta?.total || jobs.length

    const publishMutation = useApiMutation({
        mutationFn: (id: string) => jobsApi.publish(id),
        successMessage: 'Job published',
        invalidateKeys: [['jobs']],
    })

    const closeMutation = useApiMutation({
        mutationFn: (id: string) => jobsApi.close(id),
        successMessage: 'Job closed',
        invalidateKeys: [['jobs']],
    })

    const archiveMutation = useApiMutation({
        mutationFn: (id: string) => jobsApi.archive(id),
        successMessage: 'Job archived',
        invalidateKeys: [['jobs']],
    })

    const unarchiveMutation = useApiMutation({
        mutationFn: (id: string) => jobsApi.unarchive(id),
        successMessage: 'Job restored from archive',
        invalidateKeys: [['jobs']],
    })

    const duplicateMutation = useApiMutation({
        mutationFn: (id: string) => jobsApi.duplicate(id),
        successMessage: 'Job duplicated as draft',
        invalidateKeys: [['jobs']],
    })

    const repostMutation = useApiMutation({
        mutationFn: (id: string) => jobsApi.repost(id),
        successMessage: 'Job reposted as new draft',
        invalidateKeys: [['jobs']],
    })

    const deleteMutation = useApiMutation({
        mutationFn: (id: string) => jobsApi.delete(id),
        successMessage: 'Job deleted',
        invalidateKeys: [['jobs']],
    })

    return (
        <PageContainer title="Manage Jobs" description="View, edit, and manage all your job postings.">
            <div className="mt-6 w-full flex flex-col space-y-4">
                {/* Filters */}
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative flex-1 min-w-[240px] max-w-md">
                        <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 z-10" />
                        <Input
                            placeholder="Search jobs..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                            className="pl-9 bg-card"
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === 'ALL' ? '' : v); setPage(1) }}>
                        <SelectTrigger className="w-[160px] bg-card border-line">
                            <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Statuses</SelectItem>
                            <SelectItem value="DRAFT">Draft</SelectItem>
                            <SelectItem value="PUBLISHED">Published</SelectItem>
                            <SelectItem value="CLOSED">Closed</SelectItem>
                        </SelectContent>
                    </Select>
                    <button
                        onClick={() => { setShowArchived(!showArchived); setPage(1) }}
                        className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                            showArchived
                                ? 'border-amber-500/40 text-amber-400 bg-amber-500/10'
                                : 'border-line text-muted-foreground hover:text-foreground bg-card'
                        }`}
                    >
                        <Archive className="w-3.5 h-3.5" />
                        {showArchived ? 'Archived' : 'Show Archived'}
                    </button>
                    <div className="flex-1" />
                    <button
                        onClick={() => router.push('/dashboard/jobs/create')}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-accent text-accent-foreground rounded-lg hover:opacity-90 transition-opacity"
                    >
                        <Plus className="w-4 h-4" /> Create Job
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 border border-line rounded-lg bg-card/50 text-center">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total</p>
                        <p className="text-xl font-bold mt-0.5">{total}</p>
                    </div>
                    <div className="p-3 border border-line rounded-lg bg-card/50 text-center">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Published</p>
                        <p className="text-xl font-bold mt-0.5 text-emerald-400">{jobs.filter(j => j.status === 'PUBLISHED').length}</p>
                    </div>
                    <div className="p-3 border border-line rounded-lg bg-card/50 text-center">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Draft</p>
                        <p className="text-xl font-bold mt-0.5 text-muted-foreground">{jobs.filter(j => j.status === 'DRAFT').length}</p>
                    </div>
                </div>

                {/* Loading */}
                {isLoading && (
                    <div className="space-y-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="h-14 w-full rounded-lg" />
                        ))}
                    </div>
                )}

                {/* Empty */}
                {!isLoading && jobs.length === 0 && (
                    <EmptyState
                        icon={Briefcase}
                        title={showArchived ? 'No archived jobs' : 'No jobs found'}
                        description={showArchived ? 'Archived jobs will appear here.' : 'Create your first job posting to start attracting candidates.'}
                        actionLabel={showArchived ? undefined : 'Create New Job'}
                        onAction={showArchived ? undefined : () => router.push('/dashboard/jobs/create')}
                    />
                )}

                {/* Table */}
                {!isLoading && jobs.length > 0 && (
                    <div className="border border-line rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead>Visibility</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Applications</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {jobs.map(job => (
                                    <TableRow
                                        key={job._id}
                                        className="hover:bg-card/50 transition-colors cursor-pointer"
                                        onClick={() => router.push(`/dashboard/jobs/${job._id}`)}
                                    >
                                        <TableCell>
                                            <p className="font-medium text-sm">{job.title}</p>
                                            <p className="text-[11px] text-muted-foreground">{job.employmentType?.replace('_', ' ')}{job.location ? ` · ${job.location}` : ''}</p>
                                        </TableCell>
                                        <TableCell className="text-sm text-text-secondary">{job.department || '—'}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                {VISIBILITY_ICONS[job.visibility || 'PUBLIC']}
                                                <span>{(job.visibility || 'PUBLIC').replace('_', ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase())}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`text-[10px] ${STATUS_STYLES[job.status]?.class || ''}`}>
                                                {STATUS_STYLES[job.status]?.label || job.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm font-medium">{job.applicationCount || 0}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {format(new Date(job.createdAt), 'MMM d, yyyy')}
                                        </TableCell>
                                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="p-1.5 rounded-md hover:bg-muted/50 text-muted-foreground transition-colors">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                    {job.status === 'DRAFT' && (
                                                        <DropdownMenuItem onClick={() => publishMutation.mutate(job._id)}>
                                                            <Globe className="w-3.5 h-3.5 mr-2 text-emerald-400" /> Publish
                                                        </DropdownMenuItem>
                                                    )}
                                                    {job.status === 'PUBLISHED' && (
                                                        <DropdownMenuItem onClick={() => closeMutation.mutate(job._id)}>
                                                            <Archive className="w-3.5 h-3.5 mr-2 text-amber-400" /> Close Job
                                                        </DropdownMenuItem>
                                                    )}
                                                    {job.status === 'CLOSED' && (
                                                        <DropdownMenuItem onClick={() => repostMutation.mutate(job._id)}>
                                                            <RefreshCw className="w-3.5 h-3.5 mr-2 text-blue-400" /> Repost as Draft
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem onClick={() => duplicateMutation.mutate(job._id)}>
                                                        <Copy className="w-3.5 h-3.5 mr-2" /> Duplicate
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    {job.isArchived ? (
                                                        <DropdownMenuItem onClick={() => unarchiveMutation.mutate(job._id)}>
                                                            <ArchiveRestore className="w-3.5 h-3.5 mr-2 text-emerald-400" /> Restore from Archive
                                                        </DropdownMenuItem>
                                                    ) : (
                                                        <DropdownMenuItem onClick={() => archiveMutation.mutate(job._id)}>
                                                            <Archive className="w-3.5 h-3.5 mr-2" /> Archive
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => deleteMutation.mutate(job._id)}
                                                        className="text-red-400 focus:text-red-400"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        </PageContainer>
    )
}
