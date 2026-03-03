/**
 * Question Bank API Client
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

export interface MCQDetails {
    options: string[]
    correctOptions: number[]
    isMultiCorrect: boolean
}

export interface Question {
    id: string
    organizationId: string | null
    type: 'MCQ' | 'DSA'
    title: string
    difficulty: 'EASY' | 'MEDIUM' | 'HARD'
    topics: string[]
    mcqDetails: MCQDetails | null
    dsaDetails: unknown | null
    createdAt: string
}

export interface QuestionListResponse {
    data: Question[]
    total: number
    limit: number
    offset: number
}

export interface CreateQuestionInput {
    type: 'MCQ'
    title: string
    difficulty: 'EASY' | 'MEDIUM' | 'HARD'
    topics: string[]
    mcqDetails: MCQDetails
}

export interface UpdateQuestionInput {
    title?: string
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD'
    topics?: string[]
    mcqDetails?: MCQDetails
}

export interface ListQuestionsParams {
    type?: 'MCQ' | 'DSA'
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD'
    topic?: string
    search?: string
    limit?: number
    offset?: number
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...(options?.headers ?? {}),
        },
    })
    const body = await res.json()
    if (!res.ok || !body.success) {
        throw new Error(body.error?.message ?? 'API Error')
    }
    return body.data as T
}

export const questionsApi = {
    list(params: ListQuestionsParams = {}): Promise<QuestionListResponse> {
        const q = new URLSearchParams()
        if (params.type) q.set('type', params.type)
        if (params.difficulty) q.set('difficulty', params.difficulty)
        if (params.topic) q.set('topic', params.topic)
        if (params.search) q.set('search', params.search)
        if (params.limit != null) q.set('limit', String(params.limit))
        if (params.offset != null) q.set('offset', String(params.offset))
        return apiFetch<QuestionListResponse>(`/api/questions?${q.toString()}`)
    },

    create(input: CreateQuestionInput): Promise<Question> {
        return apiFetch<Question>('/api/questions', {
            method: 'POST',
            body: JSON.stringify(input),
        })
    },

    update(id: string, input: UpdateQuestionInput): Promise<Question> {
        return apiFetch<Question>(`/api/questions/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(input),
        })
    },

    delete(id: string): Promise<{ deleted: boolean }> {
        return apiFetch<{ deleted: boolean }>(`/api/questions/${id}`, {
            method: 'DELETE',
        })
    },
}
