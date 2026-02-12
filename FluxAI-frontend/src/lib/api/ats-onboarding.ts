import { apiClient } from './client'
import { ApiResponse } from './types'

export interface IOnboarding {
    _id: string
    organizationId: string
    applicationId: string
    candidateId: string
    status: 'IN_PROGRESS' | 'COMPLETED'
    startDate: string
    completedAt?: string
    documents: IOnboardingDocument[]
}

export interface IOnboardingDocument {
    _id: string
    onboardingId: string
    title: string
    fileUrl?: string
    status: 'PENDING' | 'UPLOADED' | 'APPROVED' | 'REJECTED'
    reviewedBy?: string
    reviewedAt?: string
    feedback?: string
}

export const atsOnboardingApi = {
    // Recruiter Methods
    getActiveOnboardings: async (): Promise<ApiResponse<IOnboarding[]>> => {
        return apiClient.get('/onboarding/active')
    },

    getOnboarding: async (id: string): Promise<ApiResponse<IOnboarding>> => {
        return apiClient.get(`/onboarding/${id}`)
    },

    reviewDocument: async (documentId: string, status: 'APPROVED' | 'REJECTED', feedback?: string): Promise<ApiResponse<IOnboardingDocument>> => {
        return apiClient.patch(`/onboarding/documents/${documentId}/review`, { status, feedback })
    },

    completeOnboarding: async (id: string): Promise<ApiResponse<IOnboarding>> => {
        return apiClient.post(`/onboarding/${id}/complete`, {})
    },

    // Candidate Public Methods
    getPublicOnboarding: async (token: string): Promise<ApiResponse<IOnboarding>> => {
        return apiClient.get(`/public/onboarding/${token}`)
    },

    uploadDocument: async (token: string, documentId: string, file: File): Promise<ApiResponse<IOnboardingDocument>> => {
        const formData = new FormData()
        formData.append('file', file)
        // dedicated upload endpoint
        return apiClient.post(`/public/onboarding/${token}/documents/${documentId}/upload`, formData)
    }
}
