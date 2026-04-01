'use client'

import { useState, useCallback } from 'react'
import { jobsApi, ParsedJobData } from '@/lib/api/jobs'

interface UseJobParserReturn {
    parse:   (description: string) => Promise<ParsedJobData | null>
    result:  ParsedJobData | null
    loading: boolean
    error:   string | null
    clear:   () => void
}

export function useJobParser(): UseJobParserReturn {
    const [result,  setResult]  = useState<ParsedJobData | null>(null)
    const [loading, setLoading] = useState(false)
    const [error,   setError]   = useState<string | null>(null)

    const parse = useCallback(async (description: string): Promise<ParsedJobData | null> => {
        setLoading(true)
        setError(null)
        try {
            const res = await jobsApi.parseDescription(description)
            if (res.success && res.data) {
                setResult(res.data)
                return res.data
            }
            const msg = res.error?.message || 'Parsing failed'
            setError(msg)
            return null
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Parsing failed'
            setError(msg)
            return null
        } finally {
            setLoading(false)
        }
    }, [])

    const clear = useCallback(() => {
        setResult(null)
        setError(null)
    }, [])

    return { parse, result, loading, error, clear }
}
