'use client'

import { useState, useEffect, useCallback } from 'react'
import {
    applicationsApi,
    ApplicationStage,
    JobApplicationResponse,
    ListApplicationsQuery,
    BulkUpdateInput,
} from '@/lib/api/applications'
import { pipelineApi } from '@/lib/api/pipeline'
import { PipelineStage } from '@/lib/api/types'
import { toast } from 'sonner'

interface UseApplicationsResult {
    applications: JobApplicationResponse[]
    stages: PipelineStage[]
    total: number
    page: number
    isLoading: boolean
    error: string | null
    refetch: (query?: ListApplicationsQuery) => Promise<void>
    moveStage: (id: string, stageId: string) => Promise<boolean>
    bulkMove: (applicationIds: string[], stageId: string) => Promise<{ updated: number; errors: string[] } | null>
    bulkUpdate: (input: BulkUpdateInput) => Promise<{ updated: number; errors: string[] } | null>
    setPage: (page: number) => void
    setStageFilter: (stageId: string | undefined) => void
    setSearch: (search: string) => void
    stageFilter: string | undefined
    search: string
}

export function useApplications(jobId: string, initialQuery?: ListApplicationsQuery & { stageId?: string }): UseApplicationsResult {
    const [applications, setApplications] = useState<JobApplicationResponse[]>([])
    const [stages, setStages] = useState<PipelineStage[]>([])
    const [total, setTotal] = useState(0)
    const [page, setPageState] = useState(initialQuery?.page || 1)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [stageFilter, setStageFilter] = useState<string | undefined>(initialQuery?.stageId)
    const [search, setSearchState] = useState(initialQuery?.search || '')

    const fetchStages = useCallback(async () => {
        if (!jobId) return
        try {
            const response = await pipelineApi.getStages(jobId)
            if (response.success && response.data) {
                setStages(response.data)
            }
        } catch (err) {
            console.error('Failed to fetch stages:', err)
            // Quiet failure for stages, or maybe generic toast
        }
    }, [jobId])

    const fetchApplications = useCallback(async (query?: ListApplicationsQuery) => {
        if (!jobId) return
        setIsLoading(true)
        setError(null)

        const mergedQuery: any = {
            page,
            limit: 20,
            stageId: stageFilter,
            search: search || undefined,
            ...query,
        }

        const response = await applicationsApi.listByJob(jobId, mergedQuery)

        if (response.success && response.data) {
            setApplications(response.data.applications)
            setTotal(response.data.total)
        } else {
            const msg = response.error?.message || 'Failed to load applications'
            setError(msg)
            toast.error(msg)
        }

        setIsLoading(false)
    }, [jobId, page, stageFilter, search])

    const moveStage = async (id: string, stageId: string): Promise<boolean> => {
        // Find the application and target stage
        const appToUpdate = applications.find(a => a._id === id)
        const targetStage = stages.find(s => s._id === stageId)

        if (!appToUpdate || !targetStage) return false

        // Snapshot previous state for rollback
        const previousApp = { ...appToUpdate }

        // 1. Optimistically update local state
        setApplications(prev =>
            prev.map(app =>
                app._id === id ? {
                    ...app,
                    // We optimistically assume status will match target stage type
                    // In reality, backend validation might reject logic, but for UI feedback it's fine
                    status: targetStage.type as any,
                    currentStageId: {
                        _id: targetStage._id,
                        name: targetStage.name,
                        type: targetStage.type,
                        color: targetStage.color,
                        order: targetStage.order
                    }
                } : app
            )
        )

        // 2. Call API
        const response = await applicationsApi.moveStage(id, stageId)

        // 3. Handle failure (rollback)
        if (!response.success) {
            setApplications(prev =>
                prev.map(app => app._id === id ? previousApp : app)
            )
            const msg = response.error?.message || 'Failed to move stage'
            setError(msg)
            toast.error(msg)
            return false
        }

        toast.success(`Moved to ${targetStage.name}`)
        return true
    }

    const bulkMove = async (applicationIds: string[], stageId: string) => {
        const response = await applicationsApi.bulkMove(applicationIds, stageId)
        if (response.success && response.data) {
            await fetchApplications()
            toast.success(`Moved ${applicationIds.length} applications`)
            return response.data
        }
        const msg = response.error?.message || 'Failed to perform bulk move'
        setError(msg)
        toast.error(msg)
        return null
    }

    // Wrapped for backward compatibility if needed, but confusing with new types
    const bulkUpdate = async (input: BulkUpdateInput) => {
        const response = await applicationsApi.bulkUpdate(input)
        if (response.success && response.data) {
            await fetchApplications()
            toast.success('Bulk update successful')
            return response.data
        }
        const msg = response.error?.message || 'Failed to perform bulk update'
        setError(msg)
        toast.error(msg)
        return null
    }

    const setPage = (newPage: number) => setPageState(newPage)
    const setStageFilterFn = (stageId: string | undefined) => {
        setStageFilter(stageId)
        setPageState(1)
    }
    const setSearch = (s: string) => {
        setSearchState(s)
        setPageState(1)
    }

    useEffect(() => {
        fetchStages()
    }, [fetchStages])

    useEffect(() => {
        fetchApplications()
    }, [fetchApplications])

    return {
        applications,
        stages,
        total,
        page,
        isLoading,
        error,
        refetch: fetchApplications,
        moveStage,
        bulkMove,
        bulkUpdate,
        setPage,
        setStageFilter: setStageFilterFn,
        setSearch,
        stageFilter,
        search,
    }
}
