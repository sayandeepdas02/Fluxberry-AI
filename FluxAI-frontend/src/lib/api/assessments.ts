import { apiClient } from './client'
import { Assessment } from './types'

export interface CreateAssessmentInput {
    title: string
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
     * Delete an assessment
     */
    async delete(id: string) {
        return apiClient.delete<void>(`/assessments/${id}`)
    },

    /**
     * Publish an assessment (set status to ACTIVE)
     */
    async publish(id: string) {
        return apiClient.patch<Assessment>(`/assessments/${id}`, { status: 'ACTIVE' })
    },

    /**
     * Invite candidates: enqueue invite emails for each address (assessment must be published).
     */
    async invite(assessmentId: string, payload: { emails: string[] }) {
        return apiClient.post<{ invited: number; emails: string[] }>(`/assessments/${assessmentId}/invite`, payload)
    },
}
