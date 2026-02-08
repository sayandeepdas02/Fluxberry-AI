import { apiClient } from './client'
import { AssessmentAttempt, AttemptResult } from './types'

export interface StartAttemptInput {
    candidateEmail: string
    candidateName?: string
}

export interface SubmitRoundInput {
    answers: Record<string, unknown>
}

// Candidate-facing round question (MCQ: options only, no correct answers)
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

export const attemptsApi = {
    /**
     * Start or resume an assessment attempt
     */
    async startOrResume(assessmentId: string, input: StartAttemptInput) {
        return apiClient.post<AssessmentAttempt>(`/assessments/${assessmentId}/attempts`, input)
    },

    /**
     * Get attempt details
     */
    async getById(attemptId: string) {
        return apiClient.get<AssessmentAttempt>(`/attempts/${attemptId}`)
    },

    /**
     * Start a round
     */
    async startRound(attemptId: string, roundType: string) {
        return apiClient.post<{ round: unknown; questions?: unknown[] }>(
            `/attempts/${attemptId}/rounds/${roundType}/start`
        )
    },

    /**
     * Submit a round
     */
    async submitRound(attemptId: string, roundType: string, input: SubmitRoundInput) {
        return apiClient.post<{ round: unknown; nextRound?: string }>(
            `/attempts/${attemptId}/rounds/${roundType}/submit`,
            input
        )
    },

    /**
     * Get questions for a round (candidate-facing; MCQ without correct answers)
     */
    async getRoundQuestions(attemptId: string, roundType: string) {
        return apiClient.get<RoundQuestionResponse[]>(`/attempts/${attemptId}/rounds/${roundType}/questions`)
    },

    /**
     * Get attempt result
     */
    async getResult(attemptId: string) {
        return apiClient.get<AttemptResult>(`/attempts/${attemptId}/result`)
    },

    /**
     * Log proctoring event
     */
    async logProctoringEvent(
        attemptId: string,
        event: { eventType: string; metadata?: Record<string, unknown> }
    ) {
        return apiClient.post<void>(`/attempts/${attemptId}/proctoring-events`, event)
    },
}
