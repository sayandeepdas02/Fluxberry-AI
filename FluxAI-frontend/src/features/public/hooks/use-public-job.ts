'use client'

import { useState, useEffect, useCallback } from 'react'
import { publicApi, PublicJob, PublicCompany } from '@/lib/api/public'

interface UsePublicJobResult {
    job: PublicJob | null
    company: PublicCompany | null
    isLoading: boolean
    error: string | null
    refetch: () => Promise<void>
}

export function usePublicJob(slug: string, jobId: string): UsePublicJobResult {
    const [job, setJob] = useState<PublicJob | null>(null)
    const [company, setCompany] = useState<PublicCompany | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchData = useCallback(async () => {
        if (!slug || !jobId) return
        setIsLoading(true)
        setError(null)

        try {
            // Fetch company and job in parallel
            const [companyRes, jobRes] = await Promise.all([
                publicApi.getCompany(slug),
                publicApi.getJob(slug, jobId)
            ])

            if (companyRes.success && companyRes.data) {
                setCompany(companyRes.data)
            } else {
                setError(companyRes.error?.message || 'Company not found')
            }

            if (jobRes.success && jobRes.data) {
                setJob(jobRes.data)
            } else {
                setError(prev => prev || jobRes.error?.message || 'Job not found')
            }

        } catch (err) {
            setError('Failed to load job data')
        } finally {
            setIsLoading(false)
        }
    }, [slug, jobId])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    return {
        job,
        company,
        isLoading,
        error,
        refetch: fetchData
    }
}
