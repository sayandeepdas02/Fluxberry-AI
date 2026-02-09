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
// CREATE / UPDATE BODY SCHEMAS
// ============================================

const dsaTestCaseSchema = z.object({
    stdin: z.string(),
    expectedStdout: z.string(),
})

const mcqDetailsBodySchema = z.object({
    options: z.array(z.string()).min(1),
    correctOptions: z.array(z.number().int().min(0)),
    isMultiCorrect: z.boolean(),
})

const dsaDetailsBodySchema = z.object({
    prompt: z.string().min(1),
    constraints: z.string().optional().nullable(),
    starterCode: z.record(z.string(), z.string()),
    languagesSupported: z.array(z.string()).min(1),
    testCases: z.array(dsaTestCaseSchema).optional(),
})

const baseQuestionBodySchema = z.object({
    type: z.enum(['MCQ', 'DSA']),
    title: z.string().min(1),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
    topics: z.array(z.string()).default([]),
    metadata: z.record(z.unknown()).optional().nullable(),
    mcqDetails: mcqDetailsBodySchema.optional(),
    dsaDetails: dsaDetailsBodySchema.optional(),
})

export const createQuestionBodySchema = baseQuestionBodySchema.refine(
    (data) => {
        if (data.type === 'MCQ') return data.mcqDetails != null
        if (data.type === 'DSA') return data.dsaDetails != null
        return false
    },
    { message: 'MCQ requires mcqDetails, DSA requires dsaDetails', path: ['type'] }
)

export const updateQuestionBodySchema = baseQuestionBodySchema.partial().extend({
    type: z.enum(['MCQ', 'DSA']).optional(),
    title: z.string().min(1).optional(),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
})

export type CreateQuestionBody = z.infer<typeof createQuestionBodySchema>
export type UpdateQuestionBody = z.infer<typeof updateQuestionBodySchema>

// ============================================
// RESPONSE TYPES
// ============================================

export interface MCQDetailsResponse {
    options: string[]
    correctOptions: number[]
    isMultiCorrect: boolean
}

export interface DSATestCaseResponse {
    stdin: string
    expectedStdout: string
}

export interface DSADetailsResponse {
    prompt: string
    constraints: string | null
    starterCode: Record<string, string>
    languagesSupported: string[]
    /** Test cases for Judge0 (hidden from candidate). */
    testCases?: DSATestCaseResponse[]
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
