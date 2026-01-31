'use client'

import { useState, useEffect, useCallback } from 'react'
import { Assessment } from '@/lib/api/types'
import { assessmentsApi } from '@/lib/api/assessments'

interface UseAssessmentsResult {
    assessments: Assessment[]
    isLoading: boolean
    error: string | null
    refetch: () => Promise<void>
}

export function useAssessments(): UseAssessmentsResult {
    const [assessments, setAssessments] = useState<Assessment[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchAssessments = useCallback(async () => {
        setIsLoading(true)
        setError(null)

        const response = await assessmentsApi.list()

        if (response.success && response.data) {
            setAssessments(response.data)
        } else {
            setError(response.error?.message || 'Failed to load assessments')
        }

        setIsLoading(false)
    }, [])

    useEffect(() => {
        fetchAssessments()
    }, [fetchAssessments])

    return {
        assessments,
        isLoading,
        error,
        refetch: fetchAssessments,
    }
}

interface UseAssessmentResult {
    assessment: Assessment | null
    isLoading: boolean
    error: string | null
    refetch: () => Promise<void>
}

export function useAssessment(id: string): UseAssessmentResult {
    const [assessment, setAssessment] = useState<Assessment | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchAssessment = useCallback(async () => {
        if (!id) return

        setIsLoading(true)
        setError(null)

        const response = await assessmentsApi.getById(id)

        if (response.success && response.data) {
            setAssessment(response.data)
        } else {
            setError(response.error?.message || 'Failed to load assessment')
        }

        setIsLoading(false)
    }, [id])

    useEffect(() => {
        fetchAssessment()
    }, [fetchAssessment])

    return {
        assessment,
        isLoading,
        error,
        refetch: fetchAssessment,
    }
}
