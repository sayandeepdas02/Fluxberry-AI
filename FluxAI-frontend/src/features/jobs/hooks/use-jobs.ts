'use client'

import { useState, useEffect, useCallback } from 'react'
import { jobsApi, Job, CreateJobInput, UpdateJobInput, ListJobsQuery } from '@/lib/api/jobs'

export function useJobs(initialQuery?: ListJobsQuery) {
    const [jobs, setJobs] = useState<Job[]>([])
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(initialQuery?.page ?? 1)
    const [totalPages, setTotalPages] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchJobs = useCallback(async (query?: ListJobsQuery) => {
        setLoading(true)
        setError(null)
        try {
            const res = await jobsApi.list(query || initialQuery)
            if (res.success && res.data) {
                setJobs(res.data.jobs)
                setTotal(res.data.total)
                setPage(res.data.page)
                setTotalPages(res.data.totalPages)
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to fetch jobs')
        } finally {
            setLoading(false)
        }
    }, [initialQuery])

    useEffect(() => {
        fetchJobs()
    }, [fetchJobs])

    const createJob = async (input: CreateJobInput): Promise<Job | null> => {
        try {
            const res = await jobsApi.create(input)
            if (res.success && res.data) {
                await fetchJobs()
                return res.data
            }
            return null
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to create job')
            return null
        }
    }

    const updateJob = async (id: string, input: UpdateJobInput): Promise<Job | null> => {
        try {
            const res = await jobsApi.update(id, input)
            if (res.success && res.data) {
                setJobs(prev => prev.map(j => j._id === id ? res.data! : j))
                return res.data
            }
            return null
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to update job')
            return null
        }
    }

    const publishJob = async (id: string): Promise<Job | null> => {
        try {
            const res = await jobsApi.publish(id)
            if (res.success && res.data) {
                setJobs(prev => prev.map(j => j._id === id ? res.data! : j))
                return res.data
            }
            return null
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to publish job')
            return null
        }
    }

    const closeJob = async (id: string): Promise<Job | null> => {
        try {
            const res = await jobsApi.close(id)
            if (res.success && res.data) {
                setJobs(prev => prev.map(j => j._id === id ? res.data! : j))
                return res.data
            }
            return null
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to close job')
            return null
        }
    }

    const deleteJob = async (id: string): Promise<boolean> => {
        try {
            const res = await jobsApi.delete(id)
            if (res.success) {
                setJobs(prev => prev.filter(j => j._id !== id))
                return true
            }
            return false
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to delete job')
            return false
        }
    }

    return {
        jobs,
        total,
        page,
        totalPages,
        loading,
        error,
        fetchJobs,
        createJob,
        updateJob,
        publishJob,
        closeJob,
        deleteJob,
        setError,
    }
}
