import { z } from 'zod'

// ============================================
// QUERY SCHEMAS
// ============================================

export const listQuestionsQuerySchema = z.object({
    type: z.enum(['MCQ', 'DSA']).optional(),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
    topic: z.string().optional(),
    limit: z.coerce.number().min(1).max(100).default(50),
    offset: z.coerce.number().min(0).default(0),
})

export type ListQuestionsQuery = z.infer<typeof listQuestionsQuerySchema>

// ============================================
// RESPONSE TYPES
// ============================================

export interface MCQDetailsResponse {
    options: string[]
    correctOptions: number[]
    isMultiCorrect: boolean
}

export interface DSADetailsResponse {
    prompt: string
    constraints: string | null
    starterCode: Record<string, string>
    languagesSupported: string[]
}

export interface QuestionResponse {
    id: string
    type: 'MCQ' | 'DSA'
    title: string
    difficulty: 'EASY' | 'MEDIUM' | 'HARD'
    topics: string[]
    metadata: Record<string, unknown> | null
    mcqDetails: MCQDetailsResponse | null
    dsaDetails: DSADetailsResponse | null
    createdAt: Date
}

export interface QuestionListResponse {
    data: QuestionResponse[]
    total: number
    limit: number
    offset: number
}
