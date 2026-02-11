'use client'

import { useState, useEffect, useCallback } from 'react'
import {
    applicationsApi,
    ApplicationStage,
    JobApplicationResponse,
    ListApplicationsQuery,
    BulkUpdateInput,
} from '@/lib/api/applications'

interface UseApplicationsResult {
    applications: JobApplicationResponse[]
    total: number
    page: number
    isLoading: boolean
    error: string | null
    refetch: (query?: ListApplicationsQuery) => Promise<void>
    updateStage: (id: string, stage: ApplicationStage) => Promise<boolean>
    bulkUpdate: (input: BulkUpdateInput) => Promise<{ updated: number; errors: string[] } | null>
    setPage: (page: number) => void
    setStageFilter: (stage: ApplicationStage | undefined) => void
    setSearch: (search: string) => void
    stageFilter: ApplicationStage | undefined
    search: string
}

export function useApplications(jobId: string, initialQuery?: ListApplicationsQuery): UseApplicationsResult {
    const [applications, setApplications] = useState<JobApplicationResponse[]>([])
    const [total, setTotal] = useState(0)
    const [page, setPageState] = useState(initialQuery?.page || 1)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [stageFilter, setStageFilter] = useState<ApplicationStage | undefined>(initialQuery?.stage)
    const [search, setSearchState] = useState(initialQuery?.search || '')

    const fetchApplications = useCallback(async (query?: ListApplicationsQuery) => {
        if (!jobId) return
        setIsLoading(true)
        setError(null)

        const mergedQuery: ListApplicationsQuery = {
            page,
            limit: 20,
            stage: stageFilter,
            search: search || undefined,
            ...query,
        }

        const response = await applicationsApi.listByJob(jobId, mergedQuery)

        if (response.success && response.data) {
            setApplications(response.data.applications)
            setTotal(response.data.total)
        } else {
            setError(response.error?.message || 'Failed to load applications')
        }

        setIsLoading(false)
    }, [jobId, page, stageFilter, search])

    const updateStage = async (id: string, stage: ApplicationStage): Promise<boolean> => {
        const response = await applicationsApi.updateStage(id, stage)
        if (response.success) {
            // Optimistically update local state
            setApplications(prev =>
                prev.map(app =>
                    app._id === id ? { ...app, status: stage } : app
                )
            )
            return true
        }
        setError(response.error?.message || 'Failed to update stage')
        return false
    }

    const bulkUpdate = async (input: BulkUpdateInput) => {
        const response = await applicationsApi.bulkUpdate(input)
        if (response.success && response.data) {
            // Refetch after bulk update
            await fetchApplications()
            return response.data
        }
        setError(response.error?.message || 'Failed to perform bulk update')
        return null
    }

    const setPage = (newPage: number) => setPageState(newPage)
    const setStageFilterFn = (stage: ApplicationStage | undefined) => {
        setStageFilter(stage)
        setPageState(1) // Reset to page 1 on filter change
    }
    const setSearch = (s: string) => {
        setSearchState(s)
        setPageState(1) // Reset to page 1 on search change
    }

    useEffect(() => {
        fetchApplications()
    }, [fetchApplications])

    return {
        applications,
        total,
        page,
        isLoading,
        error,
        refetch: fetchApplications,
        updateStage,
        bulkUpdate,
        setPage,
        setStageFilter: setStageFilterFn,
        setSearch,
        stageFilter,
        search,
    }
}
