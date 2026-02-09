import { z } from 'zod'

// ============================================
// REQUEST SCHEMAS
// ============================================

export const startAttemptSchema = z.object({
    candidateEmail: z.string().email(),
    candidateFirstName: z.string().optional(),
    candidateLastName: z.string().optional(),
})

export const submitRoundSchema = z.object({
    answers: z.record(z.unknown()),
})

export const submitAnswerSchema = z.object({
    answer: z.unknown(),
})

export type StartAttemptInput = z.infer<typeof startAttemptSchema>
export type SubmitRoundInput = z.infer<typeof submitRoundSchema>
export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>

// ============================================
// RESPONSE TYPES
// ============================================

export interface QuestionAttemptResponse {
    questionId: string
    questionIndex: number
    startedAt: Date | null
    endedAt: Date | null
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED'
}

export interface RoundAttemptResponse {
    id: string
    roundType: 'MCQ' | 'DSA' | 'AI'
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'EXPIRED'
    startedAt: Date | null
    endedAt: Date | null
    timeLimit: number | null // Duration in minutes
    // Per-question tracking (V1)
    currentQuestionIndex: number
    perQuestionTimeLimit: number // seconds
    questionAttempts: QuestionAttemptResponse[]
    totalQuestions: number
}

export interface AttemptResponse {
    id: string
    assessmentId: string
    assessmentTitle: string
    candidateId: string
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'TIMED_OUT' | 'DISQUALIFIED'
    startedAt: Date | null
    submittedAt: Date | null
    rounds: RoundAttemptResponse[]
    createdAt: Date
}

export interface ProctoringEventInput {
    roundType?: 'MCQ' | 'DSA' | 'AI'
    eventType: 'TAB_SWITCH' | 'FACE_NOT_DETECTED' | 'MULTIPLE_FACES' | 'MIC_MUTED' | 'FULLSCREEN_EXIT'
    severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}

export interface ProctoringEventResponse {
    id: string
    eventType: string
    severity: string
    roundType: string | null
    createdAt: Date
}

export interface ProctoringSummaryResponse {
    totalEvents: number
    bySeverity: Record<string, number>
    byType: Record<string, number>
}

// Questions for candidate (MCQ: options only, no correct answers)
export interface RoundQuestionMCQ {
    id: string
    type: 'MCQ'
    title: string
    difficulty: string
    options: string[]
    isMultiCorrect: boolean
}

export interface RoundQuestionDSA {
    id: string
    type: 'DSA'
    title: string
    difficulty: string
    prompt: string
    constraints: string | null
    starterCode: Record<string, string>
    languagesSupported: string[]
}

export type RoundQuestionResponse = RoundQuestionMCQ | RoundQuestionDSA

// Per-question API responses
export interface CurrentQuestionResponse {
    questionIndex: number
    questionId: string
    question: RoundQuestionResponse
    startedAt: Date | null
    perQuestionTimeLimit: number // seconds
    totalQuestions: number
    roundType: 'MCQ' | 'DSA' | 'AI'
}

export interface StartQuestionResponse {
    questionIndex: number
    questionId: string
    startedAt: Date
    perQuestionTimeLimit: number // seconds
}

export interface SubmitAnswerResponse {
    success: boolean
    nextQuestionIndex: number | null // null if round complete
    roundComplete: boolean
}

