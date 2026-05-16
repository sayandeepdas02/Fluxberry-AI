import { apiClient } from './client'

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

export const questionsApi = {
    async list(params: ListQuestionsParams = {}): Promise<QuestionListResponse> {
        const queryParams: Record<string, string> = {}
        if (params.type) queryParams.type = params.type
        if (params.difficulty) queryParams.difficulty = params.difficulty
        if (params.topic) queryParams.topic = params.topic
        if (params.search) queryParams.search = params.search
        if (params.limit != null) queryParams.limit = String(params.limit)
        if (params.offset != null) queryParams.offset = String(params.offset)

        const res = await apiClient.get<QuestionListResponse>('/questions', queryParams)
        if (!res.success || !res.data) throw new Error(res.error?.message ?? 'API Error')
        return res.data
    },

    async create(input: CreateQuestionInput): Promise<Question> {
        const res = await apiClient.post<Question>('/questions', input)
        if (!res.success || !res.data) throw new Error(res.error?.message ?? 'API Error')
        return res.data
    },

    async update(id: string, input: UpdateQuestionInput): Promise<Question> {
        const res = await apiClient.patch<Question>(`/questions/${id}`, input)
        if (!res.success || !res.data) throw new Error(res.error?.message ?? 'API Error')
        return res.data
    },

    async delete(id: string): Promise<{ deleted: boolean }> {
        const res = await apiClient.delete<{ deleted: boolean }>(`/questions/${id}`)
        if (!res.success || !res.data) throw new Error(res.error?.message ?? 'API Error')
        return res.data
    },
}
