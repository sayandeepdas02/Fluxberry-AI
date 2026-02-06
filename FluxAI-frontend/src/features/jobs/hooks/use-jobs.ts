'use client'

import { useState, useEffect, useCallback } from 'react'
import { Job, jobsApi, CreateJobInput, ListJobsQuery } from '@/lib/api/jobs'

interface UseJobsResult {
    jobs: Job[]
    total: number
    isLoading: boolean
    error: string | null
    refetch: (query?: ListJobsQuery) => Promise<void>
    createJob: (data: CreateJobInput) => Promise<Job | null>
}

export function useJobs(initialQuery?: ListJobsQuery): UseJobsResult {
    const [jobs, setJobs] = useState<Job[]>([])
    const [total, setTotal] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchJobs = useCallback(async (query: ListJobsQuery = {}) => {
        setIsLoading(true)
        setError(null)

        const mergedQuery = { ...initialQuery, ...query }
        const response = await jobsApi.list(mergedQuery)

        if (response.success && response.data) {
            setJobs(response.data.jobs)
            setTotal(response.data.total)
        } else {
            setError(response.error?.message || 'Failed to load jobs')
        }

        setIsLoading(false)
    }, [initialQuery])

    const createJob = async (data: CreateJobInput): Promise<Job | null> => {
        setError(null)
        const response = await jobsApi.create(data)
        if (response.success && response.data) {
            setJobs(prev => [response.data!, ...prev])
            return response.data
        } else {
            setError(response.error?.message || 'Failed to create job')
            return null
        }
    }

    useEffect(() => {
        fetchJobs()
    }, [fetchJobs])

    return {
        jobs,
        total,
        isLoading,
        error,
        refetch: fetchJobs,
        createJob
    }
}
