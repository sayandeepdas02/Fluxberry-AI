import { z } from 'zod'

// ============================================
// TYPES
// ============================================

export interface EvaluationResult {
    id: string
    roundType: 'MCQ' | 'DSA' | 'AI'
    score: number
    maxScore: number
    percentage: number
    metadata: Record<string, unknown> | null
    evaluatedAt: Date
}

export interface MCQAnswer {
    questionId: string
    selectedOptions: number[]
}

export interface MCQEvaluationMetadata {
    totalQuestions: number
    correctAnswers: number
    questionResults: Array<{
        questionId: string
        correct: boolean
        selectedOptions: number[]
        correctOptions: number[]
    }>
    [key: string]: unknown
}

export interface DSAEvaluationMetadata {
    submissionId?: string
    code?: string
    language?: string
    status: 'PENDING' | 'EVALUATED'
    [key: string]: unknown
}

export interface AIEvaluationMetadata {
    transcriptRef?: string
    videoRef?: string
    summary?: string
    status: 'PENDING' | 'EVALUATED'
    [key: string]: unknown
}

export const mcqAnswersSchema = z.record(z.array(z.number()))
