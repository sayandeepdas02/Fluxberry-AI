'use client'

import { useState, useEffect, useCallback } from 'react'
import { Candidate, candidatesApi, CreateCandidateInput, ListCandidatesQuery } from '@/lib/api/candidates'

interface UseCandidatesResult {
    candidates: Candidate[]
    total: number
    isLoading: boolean
    error: string | null
    refetch: (query?: ListCandidatesQuery) => Promise<void>
    createCandidate: (data: CreateCandidateInput) => Promise<Candidate | null>
}

export function useCandidates(initialQuery?: ListCandidatesQuery): UseCandidatesResult {
    const [candidates, setCandidates] = useState<Candidate[]>([])
    const [total, setTotal] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchCandidates = useCallback(async (query: ListCandidatesQuery = {}) => {
        setIsLoading(true)
        setError(null)

        const mergedQuery = { ...initialQuery, ...query }
        const response = await candidatesApi.list(mergedQuery)

        if (response.success && response.data) {
            setCandidates(response.data || [])
            setTotal(response.meta?.total || 0)
        } else {
            setError(response.error?.message || 'Failed to load candidates')
        }

        setIsLoading(false)
    }, [initialQuery])

    const createCandidate = async (data: CreateCandidateInput): Promise<Candidate | null> => {
        setError(null)
        const response = await candidatesApi.create(data)
        if (response.success && response.data) {
            setCandidates(prev => [response.data!, ...prev])
            setTotal(prev => prev + 1)
            return response.data
        } else {
            setError(response.error?.message || 'Failed to create candidate')
            return null
        }
    }

    useEffect(() => {
        fetchCandidates()
    }, [fetchCandidates])

    return {
        candidates,
        total,
        isLoading,
        error,
        refetch: fetchCandidates,
        createCandidate
    }
}
