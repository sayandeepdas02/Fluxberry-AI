import { apiClient } from './client'
import { AssessmentAttempt, AttemptResult } from './types'

export interface StartAttemptInput {
    candidateEmail: string
    candidateFirstName?: string
    candidateLastName?: string
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

    /**
     * Get assessment public details
     */
    async getAssessment(id: string) {
        return apiClient.get<{ organizationId: string }>(`/assessments/${id}`)
    },

    /**
     * Upload and attach resume
     */
    async uploadResume(attemptId: string, candidateId: string, assessmentId: string, file: File) {
        // 1. Get organization ID (or infer/skip if backend handles it)
        const assessRes = await apiClient.get<{ organizationId: string }>(`/assessments/${assessmentId}`)
        if (!assessRes.success || !assessRes.data) throw new Error('Failed to get assessment details')
        const organizationId = assessRes.data.organizationId

        // 2. Request upload URL
        const urlRes = await apiClient.post<{ fileId: string; uploadUrl: string }>('/files/upload-url', {
            candidateId,
            organizationId,
            fileType: 'RESUME',
            mimeType: file.type || 'application/pdf',
            size: file.size
        })
        if (!urlRes.success || !urlRes.data) throw new Error(urlRes.error?.message || 'Failed to get upload URL')

        const { fileId, uploadUrl } = urlRes.data

        // 3. Upload file to S3
        const upload = await fetch(uploadUrl, {
            method: 'PUT',
            body: file,
            headers: { 'Content-Type': file.type || 'application/pdf' }
        })
        if (!upload.ok) throw new Error('Failed to upload file to storage')

        // 4. Attach to attempt
        return apiClient.post(`/attempts/${attemptId}/resume`, {
            candidateId,
            fileId
        })
    },
}
