'use client'

import { useState, useEffect, useCallback } from 'react'
import { publicApi, PublicCompany, PublicJob, PublicJobCard } from '@/lib/api/public'

interface UsePublicCompanyResult {
    company: PublicCompany | null
    jobs: PublicJobCard[]
    isLoading: boolean
    error: string | null
    refetch: () => Promise<void>
}

export function usePublicCompany(slug: string): UsePublicCompanyResult {
    const [company, setCompany] = useState<PublicCompany | null>(null)
    const [jobs, setJobs] = useState<PublicJobCard[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchData = useCallback(async () => {
        if (!slug) return
        setIsLoading(true)
        setError(null)

        try {
            const [companyRes, jobsRes] = await Promise.all([
                publicApi.getCompany(slug),
                publicApi.getCompanyJobs(slug)
            ])

            if (companyRes.success && companyRes.data) {
                setCompany(companyRes.data)
            } else {
                setError(companyRes.error?.message || 'Company not found')
            }

            if (jobsRes.success && jobsRes.data) {
                setJobs(jobsRes.data)
            }
        } catch (err) {
            setError('Failed to load company data')
        } finally {
            setIsLoading(false)
        }
    }, [slug])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    return {
        company,
        jobs,
        isLoading,
        error,
        refetch: fetchData
    }
}
