'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { jobsApi, Job, CreateJobInput, UpdateJobInput, ListJobsQuery } from '@/lib/api/jobs'
import { ApiError } from '@/lib/api/client'
import { useApiMutation } from '@/lib/hooks/use-api-mutation'
import { jobKeys } from '@/lib/query/queryKeys'

export { jobKeys }

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
            if (!res.success) throw new ApiError(res.error?.message ?? 'Failed to fetch jobs', res.error?.code ?? 'UNKNOWN', res.error?.details)
            return res
        },
    })

    const jobs: Job[] = data?.data || []
    const total: number = data?.meta?.total ?? 0
    const page: number = data?.meta?.page ?? 1
    const totalPages: number = data?.meta?.totalPages ?? 0
    const error: string | null = rawError ? (rawError as Error).message : null

    const createJob = useApiMutation({
        mutationFn: async (input: CreateJobInput) => {
            const res = await jobsApi.create(input)
            if (!res.success) {
                let msg = res.error?.message ?? 'Failed to create job'
                if (res.error?.code === 'VALIDATION_ERROR' && Array.isArray(res.error.details)) {
                    msg = res.error.details.map((d: any) => d.message).join(', ')
                }
                throw new ApiError(msg, res.error?.code ?? 'UNKNOWN', res.error?.details)
            }
            return res.data!
        },
        successMessage: 'Job created successfully',
        invalidateKeys: [jobKeys.all],
    })

    const updateJob = useApiMutation({
        mutationFn: async ({ id, input }: { id: string; input: UpdateJobInput }) => {
            const res = await jobsApi.update(id, input)
            if (!res.success) {
                let msg = res.error?.message ?? 'Failed to update job'
                if (res.error?.code === 'VALIDATION_ERROR' && Array.isArray(res.error.details)) {
                    msg = res.error.details.map((d: any) => d.message).join(', ')
                }
                throw new ApiError(msg, res.error?.code ?? 'UNKNOWN', res.error?.details)
            }
            return res.data!
        },
        successMessage: 'Job updated successfully',
        onSuccess: (updated) => {
            // Optimistic cache update — no extra network round-trip
            queryClient.setQueriesData({ queryKey: jobKeys.all }, (old: any) => {
                if (!old?.data) return old
                return { ...old, data: old.data.map((j: Job) => j._id === updated._id ? updated : j) }
            })
        },
    })

    const publishJob = useApiMutation({
        mutationFn: async (id: string) => {
            const res = await jobsApi.publish(id)
            if (!res.success) throw new ApiError(res.error?.message ?? 'Failed to publish job', res.error?.code ?? 'UNKNOWN', res.error?.details)
            return res.data!
        },
        successMessage: 'Job published',
        invalidateKeys: [jobKeys.all],
    })

    const closeJob = useApiMutation({
        mutationFn: async (id: string) => {
            const res = await jobsApi.close(id)
            if (!res.success) throw new ApiError(res.error?.message ?? 'Failed to close job', res.error?.code ?? 'UNKNOWN', res.error?.details)
            return res.data!
        },
        successMessage: 'Job closed',
        invalidateKeys: [jobKeys.all],
    })

    const deleteJob = useApiMutation({
        mutationFn: async (id: string) => {
            const res = await jobsApi.delete(id)
            if (!res.success) throw new ApiError(res.error?.message ?? 'Failed to delete job', res.error?.code ?? 'UNKNOWN', res.error?.details)
        },
        successMessage: 'Job deleted',
        invalidateKeys: [jobKeys.all],
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
