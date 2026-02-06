'use client'

import { useState, useEffect, useCallback } from 'react'
import { Job, jobsApi, CreateJobInput } from '@/lib/api/jobs'

interface UseJobsResult {
    jobs: Job[]
    isLoading: boolean
    error: string | null
    refetch: () => Promise<void>
    createJob: (data: CreateJobInput) => Promise<Job | null>
}

export function useJobs(): UseJobsResult {
    const [jobs, setJobs] = useState<Job[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchJobs = useCallback(async () => {
        setIsLoading(true)
        setError(null)

        const response = await jobsApi.list()

        if (response.success && response.data) {
            setJobs(response.data)
        } else {
            setError(response.error?.message || 'Failed to load jobs')
        }

        setIsLoading(false)
    }, [])

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
        isLoading,
        error,
        refetch: fetchJobs,
        createJob
    }
}
