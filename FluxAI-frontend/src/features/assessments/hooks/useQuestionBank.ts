"use client"

import { useState, useEffect, useCallback } from 'react'
import { questionsApi, type Question, type ListQuestionsParams, type CreateQuestionInput, type UpdateQuestionInput } from '@/lib/api/questions'

interface UseQuestionBankOptions extends ListQuestionsParams {
    enabled?: boolean
}

export function useQuestionBank(options: UseQuestionBankOptions = {}) {
    const { enabled = true, ...params } = options
    const [questions, setQuestions] = useState<Question[]>([])
    const [total, setTotal] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchQuestions = useCallback(async () => {
        if (!enabled) return
        setIsLoading(true)
        setError(null)
        try {
            const result = await questionsApi.list({ type: 'MCQ', limit: 100, ...params })
            setQuestions(result.data)
            setTotal(result.total)
        } catch (e: any) {
            setError(e.message ?? 'Failed to load questions')
        } finally {
            setIsLoading(false)
        }
    }, [enabled, params.search, params.difficulty, params.topic, params.type])

    useEffect(() => {
        fetchQuestions()
    }, [fetchQuestions])

    const createQuestion = useCallback(async (input: CreateQuestionInput): Promise<Question> => {
        const q = await questionsApi.create(input)
        setQuestions(prev => [q, ...prev])
        setTotal(prev => prev + 1)
        return q
    }, [])

    const updateQuestion = useCallback(async (id: string, input: UpdateQuestionInput): Promise<Question> => {
        const q = await questionsApi.update(id, input)
        setQuestions(prev => prev.map(x => x.id === id ? q : x))
        return q
    }, [])

    const deleteQuestion = useCallback(async (id: string): Promise<void> => {
        await questionsApi.delete(id)
        setQuestions(prev => prev.filter(x => x.id !== id))
        setTotal(prev => prev - 1)
    }, [])

    return {
        questions,
        total,
        isLoading,
        error,
        refresh: fetchQuestions,
        createQuestion,
        updateQuestion,
        deleteQuestion,
    }
}
