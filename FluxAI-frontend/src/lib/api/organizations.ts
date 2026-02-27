import { apiClient } from './client'
import { ApiResponse, Organization } from './types'

export interface OrganizationMember {
    _id: string
    firstName: string
    lastName: string
    email: string
    role: string
    status: string
}

export const organizationsApi = {
    getMembers: async (organizationId: string): Promise<ApiResponse<OrganizationMember[]>> => {
        return apiClient.get(`/organizations/${organizationId}/members`)
    },

    // For current user's org
    getCurrentMembers: async (): Promise<ApiResponse<OrganizationMember[]>> => {
        return apiClient.get(`/organizations/members`)
    },

    getOnboardingSettings: async (): Promise<ApiResponse<any>> => {
        return apiClient.get(`/organizations/onboarding-settings`)
    },

    updateOnboardingSettings: async (data: any): Promise<ApiResponse<any>> => {
        return apiClient.patch(`/organizations/onboarding-settings`, data)
    }
}
