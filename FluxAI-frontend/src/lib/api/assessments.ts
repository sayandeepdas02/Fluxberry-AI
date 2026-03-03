import { apiClient } from './client'
import { Assessment } from './types'

export interface CreateAssessmentInput {
    title: string
    jobId?: string
    description?: string
    passingScore?: number
    timeLimit?: number
    rounds?: {
        roundType: 'MCQ' | 'DSA' | 'AI'
        order: number
        enabled: boolean
        timeLimit: number
        config?: Record<string, unknown>
    }[]
}

export interface UpdateAssessmentInput {
    title?: string
    description?: string
    status?: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED'
    passingScore?: number
    timeLimit?: number
    shuffleQuestions?: boolean
    showResults?: boolean
    proctoringEnabled?: boolean
}

/** Payload for PUT /assessments/:id/rounds - config per round for publish validation */
export interface RoundConfigInput {
    MCQ?: { enabled: boolean; order: number; config: { singleCorrectQuestionIds: string[]; multiCorrectQuestionIds: string[] } | null }
    DSA?: { enabled: boolean; order: number; config: { questionIds: string[] } | null }
    AI?: {
        enabled: boolean
        order: number
        config: {
            role?: 'FRONTEND' | 'BACKEND' | 'FULLSTACK' | 'DEVOPS'
            difficulty?: 'JUNIOR' | 'MID' | 'SENIOR'
            maxDurationMinutes?: number
            grillingIntensity?: 'LOW' | 'MEDIUM' | 'HIGH'
            maxFundamentalQuestions?: number
            maxProjectFollowUps?: number
            agentId?: string  // legacy Ribbon compat
        } | null
    }
}

export const assessmentsApi = {
    /**
     * List all assessments for the organization
     */
    async list() {
        return apiClient.get<Assessment[]>('/assessments')
    },

    /**
     * Get a single assessment by ID
     */
    async getById(id: string) {
        return apiClient.get<Assessment>(`/assessments/${id}`)
    },

    /**
     * Create a new assessment
     */
    async create(input: CreateAssessmentInput) {
        return apiClient.post<Assessment>('/assessments', input)
    },

    /**
     * Update an existing assessment
     */
    async update(id: string, input: UpdateAssessmentInput) {
        return apiClient.patch<Assessment>(`/assessments/${id}`, input)
    },

    /**
     * Configure rounds for an assessment (DRAFT only). Persist enabled rounds and config for publish.
     */
    async configureRounds(id: string, input: RoundConfigInput) {
        return apiClient.put<Assessment>(`/assessments/${id}/rounds`, input)
    },

    /**
     * Delete an assessment
     */
    async delete(id: string) {
        return apiClient.delete<void>(`/assessments/${id}`)
    },

    /**
     * Publish an assessment (set status to ACTIVE). Must be DRAFT.
     */
    async publish(id: string) {
        return apiClient.post<Assessment>(`/assessments/${id}/publish`)
    },

    /**
     * Invite candidates: enqueue invite emails for each address (assessment must be published).
     */
    async invite(assessmentId: string, payload: { emails: string[] }) {
        return apiClient.post<{ invited: number; emails: string[] }>(`/assessments/${assessmentId}/invite`, payload)
    },

    /**
     * Clone an assessment as a new DRAFT (copies all round configs).
     * Optional title to rename the clone before saving.
     */
    async clone(id: string, title?: string) {
        return apiClient.post<Assessment>(`/assessments/${id}/clone`, { title })
    },
}
