import { apiClient } from './client'
import { ApiResponse, PaginatedResponse } from './types'

export interface IOfferTemplate {
    _id: string
    organizationId: string
    name: string
    type: 'FULL_TIME' | 'INTERN' | 'CONTRACTOR'
    country?: string
    htmlContent: string
    variables: string[]
    version: number
    isActive: boolean
    createdBy?: string
    createdAt: string
    updatedAt: string
}

export interface IOffer {
    _id: string
    organizationId: string
    applicationId: string
    candidateId: string
    templateId?: string
    status: 'DRAFT' | 'SENT' | 'VIEWED' | 'SIGNED' | 'REJECTED' | 'EXPIRED'
    filledVariables?: Record<string, any>
    generatedPdfUrl?: string
    signedPdfUrl?: string
    expiresAt?: string
    viewedAt?: string
    signedAt?: string
    rejectedReason?: string
    publicToken?: string
    auditLog?: {
        event: string
        timestamp: string
        ipAddress: string
    }[]
    createdAt: string
    updatedAt: string
}

export interface IOnboardingFormField {
    id: string
    type: 'text' | 'number' | 'dropdown' | 'date' | 'file' | 'checkbox' | 'signature'
    label: string
    required: boolean
    options?: string[]
    conditionalLogic?: Record<string, any>
    validationRules?: Record<string, any>
}

export interface IOnboardingFormTemplate {
    _id: string
    organizationId: string
    name: string
    fields: IOnboardingFormField[]
    version: number
    createdAt: string
    updatedAt: string
}

export interface IOnboardingFormResponse {
    _id: string
    onboardingId: string
    formTemplateId: string
    responses: Record<string, any>
    status: 'IN_PROGRESS' | 'SUBMITTED' | 'NEEDS_REVISION'
    feedback?: { fieldId: string, message: string }[]
    submittedAt?: string
    createdAt: string
    updatedAt: string
}

export interface CreateOfferInput {
    applicationId: string
    templateId: string
    variables: Record<string, any>
    expiresInDays?: number
}

export interface CreateTemplateInput {
    name: string
    type: 'FULL_TIME' | 'INTERN' | 'CONTRACTOR'
    country?: string
    htmlContent: string
    variables?: string[]
}

export const offersApi = {
    // Templates
    getTemplates: async (): Promise<ApiResponse<IOfferTemplate[]>> => {
        return apiClient.get('/offers/templates')
    },

    getTemplate: async (id: string): Promise<ApiResponse<IOfferTemplate>> => {
        return apiClient.get(`/offers/templates/${id}`)
    },

    createTemplate: async (data: CreateTemplateInput): Promise<ApiResponse<IOfferTemplate>> => {
        return apiClient.post('/offers/templates', data)
    },

    updateTemplate: async (id: string, data: Partial<CreateTemplateInput>): Promise<ApiResponse<IOfferTemplate>> => {
        return apiClient.patch(`/offers/templates/${id}`, data)
    },

    // Offers
    createOffer: async (data: CreateOfferInput): Promise<ApiResponse<IOffer>> => {
        return apiClient.post('/offers', data)
    },

    getOffers: async (): Promise<ApiResponse<IOffer[]>> => {
        return apiClient.get('/offers')
    },

    getOffer: async (id: string): Promise<ApiResponse<IOffer>> => {
        return apiClient.get(`/offers/${id}`)
    },

    getOffersByApplication: async (applicationId: string): Promise<ApiResponse<IOffer[]>> => {
        return apiClient.get(`/offers/application/${applicationId}`)
    },

    sendOffer: async (id: string): Promise<ApiResponse<IOffer>> => {
        return apiClient.post(`/offers/${id}/send`, {})
    },

    // Public Access
    getPublicOffer: async (token: string): Promise<ApiResponse<IOffer>> => {
        return apiClient.get(`/public/offers/${token}`)
    },

    acceptOffer: async (token: string, signatureData: { name: string; data: string }): Promise<ApiResponse<IOffer>> => {
        return apiClient.post(`/public/offers/${token}/accept`, signatureData)
    },

    declineOffer: async (token: string, reason: string): Promise<ApiResponse<IOffer>> => {
        return apiClient.post(`/public/offers/${token}/decline`, { reason })
    }
}
