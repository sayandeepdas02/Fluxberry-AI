'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { jobsApi, Job, CreateJobInput, UpdateJobInput, ListJobsQuery } from '@/lib/api/jobs'
import { toast } from 'sonner'

// Query key factory — typed, consistent, prevents cache collisions
export const jobKeys = {
    all: ['jobs'] as const,
    list: (query?: ListJobsQuery) => [...jobKeys.all, 'list', query ?? {}] as const,
    detail: (id: string) => [...jobKeys.all, 'detail', id] as const,
}

export function useJobs(initialQuery?: ListJobsQuery) {
    const queryClient = useQueryClient()

    const {
        data,
        isLoading: loading,
        error: rawError,
        refetch,
    } = useQuery({
        queryKey: jobKeys.list(initialQuery),
        queryFn: async () => {
            const res = await jobsApi.list(initialQuery)
            if (!res.success) throw new Error(res.error?.message ?? 'Failed to fetch jobs')
            return res.data!
        },
    })

    const jobs: Job[] = data?.jobs ?? []
    const total: number = data?.total ?? 0
    const page: number = data?.page ?? 1
    const totalPages: number = data?.totalPages ?? 0
    const error: string | null = rawError ? (rawError as Error).message : null

    const createJob = useMutation({
        mutationFn: async (input: CreateJobInput) => {
            const res = await jobsApi.create(input)
            if (!res.success) {
                let msg = res.error?.message ?? 'Failed to create job'
                if (res.error?.code === 'VALIDATION_ERROR' && Array.isArray(res.error.details)) {
                    msg = res.error.details.map((d: any) => d.message).join(', ')
                }
                throw new Error(msg)
            }
            return res.data!
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: jobKeys.all })
            toast.success('Job created successfully')
        },
        onError: (err: Error) => toast.error(err.message),
    })

    const updateJob = useMutation({
        mutationFn: async ({ id, input }: { id: string; input: UpdateJobInput }) => {
            const res = await jobsApi.update(id, input)
            if (!res.success) {
                let msg = res.error?.message ?? 'Failed to update job'
                if (res.error?.code === 'VALIDATION_ERROR' && Array.isArray(res.error.details)) {
                    msg = res.error.details.map((d: any) => d.message).join(', ')
                }
                throw new Error(msg)
            }
            return res.data!
        },
        onSuccess: (updated) => {
            // Optimistic cache update — no extra network round-trip
            queryClient.setQueriesData({ queryKey: jobKeys.all }, (old: any) => {
                if (!old?.jobs) return old
                return { ...old, jobs: old.jobs.map((j: Job) => j._id === updated._id ? updated : j) }
            })
            toast.success('Job updated successfully')
        },
        onError: (err: Error) => toast.error(err.message),
    })

    const publishJob = useMutation({
        mutationFn: async (id: string) => {
            const res = await jobsApi.publish(id)
            if (!res.success) throw new Error(res.error?.message ?? 'Failed to publish job')
            return res.data!
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: jobKeys.all })
            toast.success('Job published')
        },
        onError: (err: Error) => toast.error(err.message),
    })

    const closeJob = useMutation({
        mutationFn: async (id: string) => {
            const res = await jobsApi.close(id)
            if (!res.success) throw new Error(res.error?.message ?? 'Failed to close job')
            return res.data!
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: jobKeys.all })
            toast.success('Job closed')
        },
        onError: (err: Error) => toast.error(err.message),
    })

    const deleteJob = useMutation({
        mutationFn: async (id: string) => {
            const res = await jobsApi.delete(id)
            if (!res.success) throw new Error(res.error?.message ?? 'Failed to delete job')
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: jobKeys.all })
            toast.success('Job deleted')
        },
        onError: (err: Error) => toast.error(err.message),
    })

    // ── Backward-compatible surface (callers unchanged) ──────────────────────
    return {
        jobs,
        total,
        page,
        totalPages,
        loading,
        error,
        fetchJobs: () => refetch(),
        createJob: (input: CreateJobInput) => createJob.mutateAsync(input),
        updateJob: (id: string, input: UpdateJobInput) => updateJob.mutateAsync({ id, input }),
        publishJob: (id: string) => publishJob.mutateAsync(id),
        closeJob: (id: string) => closeJob.mutateAsync(id),
        deleteJob: (id: string) => deleteJob.mutateAsync(id),
        setError: (_: string | null) => {}, // no-op: errors now managed by React Query
    }
}
