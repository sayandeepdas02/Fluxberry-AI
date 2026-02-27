import { apiClient } from './client'
import { ApiResponse } from './types'

export interface ActivityLogEntry {
    _id: string
    entityType: string
    entityId: string
    eventType: string
    metadata: Record<string, any>
    timestamp: string
}

export interface TimelineResponse {
    timeline: ActivityLogEntry[]
    pagination: {
        total: number
        page: number
        pages: number
    }
}

export const candidateOnboardingApi = {
    /**
     * Get Candidate Onboarding Status (Documents & Checklists)
     */
    async getStatus(applicationId: string): Promise<ApiResponse<any>> {
        return apiClient.get(`/candidate-onboarding/application/${applicationId}`)
    },

    /**
     * Reject a Submitted Onboarding Form
     */
    async rejectForm(onboardingId: string, feedback: { fieldId: string, message: string }[]): Promise<ApiResponse<any>> {
        return apiClient.patch(`/candidate-onboarding/form/${onboardingId}/reject`, { feedback })
    },

    /**
     * Get paginated ActivityLog Timeline
     */
    async getTimeline(onboardingId: string, page: number = 1, limit: number = 20): Promise<ApiResponse<TimelineResponse>> {
        return apiClient.get(`/candidate-onboarding/${onboardingId}/timeline?page=${page}&limit=${limit}`)
    }
}
