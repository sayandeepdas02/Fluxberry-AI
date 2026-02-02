import { apiClient } from './client'

export interface CompleteOnboardingInput {
    fullName?: string
    companyRole?: string
    companyWebsite?: string
    productSelection?: 'ats' | 'hire' | 'both'
    workspaceName: string
}

export interface OnboardingResponse {
    user: {
        id: string
        email: string
        firstName: string
        lastName: string
        onboardingCompleted: boolean
        organization: {
            id: string
            name: string
            slug: string
            role: string
        } | null
    }
}

export const onboardingApi = {
    /**
     * Complete onboarding and update organization
     */
    async complete(input: CompleteOnboardingInput) {
        return apiClient.post<OnboardingResponse>('/onboarding/complete', input)
    },
}
