"use client"

import { PageContainer } from "@/components/dashboard/page-container"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { jobsApi, Job, CreateJobInput } from "@/lib/api/jobs"
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
    Briefcase, Loader2, Plus, Search, Eye, Pencil, Trash2,
    Globe, Lock, Archive, MoreHorizontal, CheckCircle, XCircle,
} from "lucide-react"
import { useState, useMemo } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import { useRouter } from "next/navigation"

const STATUS_STYLES: Record<string, { label: string; class: string }> = {
    DRAFT: { label: 'Draft', class: 'bg-muted text-muted-foreground' },
    PUBLISHED: { label: 'Published', class: 'bg-emerald-500/10 text-emerald-400' },
    CLOSED: { label: 'Closed', class: 'bg-red-500/10 text-red-400' },
}

export default function ManageJobsPage() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [page, setPage] = useState(1)

    const { data: response, isLoading } = useQuery({
        queryKey: ['jobs', page, statusFilter, search],
        queryFn: () => jobsApi.list({
            page, limit: 20,
            status: (statusFilter || undefined) as any,
            search: search || undefined,
        }),
    })

    const jobs = (response?.data || []) as Job[]
    const total = (response as any)?.meta?.total || jobs.length

    const publishMutation = useMutation({
        mutationFn: (id: string) => jobsApi.publish(id),
        onSuccess: () => {
            toast.success('Job published')
            queryClient.invalidateQueries({ queryKey: ['jobs'] })
        },
        onError: () => toast.error('Failed to publish job'),
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => jobsApi.delete(id),
        onSuccess: () => {
            toast.success('Job deleted')
            queryClient.invalidateQueries({ queryKey: ['jobs'] })
        },
        onError: () => toast.error('Failed to delete job'),
    })

    const closeMutation = useMutation({
        mutationFn: (id: string) => jobsApi.close(id),
        onSuccess: () => {
            toast.success('Job closed')
            queryClient.invalidateQueries({ queryKey: ['jobs'] })
        },
        onError: () => toast.error('Failed to close job'),
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
                        title="No jobs found"
                        description="Create your first job posting to start attracting candidates."
                        actionLabel="Create New Job"
                        onAction={() => router.push('/dashboard/jobs/create')}
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
                                    <TableHead>Location</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Applications</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {jobs.map(job => (
                                    <TableRow key={job._id} className="hover:bg-card/50 transition-colors">
                                        <TableCell>
                                            <p className="font-medium text-sm">{job.title}</p>
                                            <p className="text-[11px] text-muted-foreground">{job.employmentType?.replace('_', ' ')}</p>
                                        </TableCell>
                                        <TableCell className="text-sm text-text-secondary">{job.department || '—'}</TableCell>
                                        <TableCell className="text-sm text-text-secondary">{job.location || '—'}</TableCell>
                                        <TableCell>
                                            <Badge className={`text-[10px] ${STATUS_STYLES[job.status]?.class || ''}`}>
                                                {STATUS_STYLES[job.status]?.label || job.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm font-medium">{job.applicationCount || 0}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {format(new Date(job.createdAt), 'MMM d, yyyy')}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {job.status === 'DRAFT' && (
                                                    <button
                                                        onClick={() => publishMutation.mutate(job._id)}
                                                        disabled={publishMutation.isPending}
                                                        className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-md transition-colors"
                                                        title="Publish"
                                                    >
                                                        <Globe className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                                {job.status === 'PUBLISHED' && (
                                                    <button
                                                        onClick={() => closeMutation.mutate(job._id)}
                                                        className="p-1.5 text-amber-400 hover:bg-amber-500/10 rounded-md transition-colors"
                                                        title="Close"
                                                    >
                                                        <Archive className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => deleteMutation.mutate(job._id)}
                                                    disabled={deleteMutation.isPending}
                                                    className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
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
