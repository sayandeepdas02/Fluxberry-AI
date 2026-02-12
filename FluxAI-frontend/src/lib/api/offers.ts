import { apiClient } from './client'
import { ApiResponse, PaginatedResponse } from './types'

export interface IOfferTemplate {
    _id: string
    organizationId: string
    name: string
    content: string
    variables: string[]
    variableSchema: Record<string, { type: string; label: string }>
    isActive: boolean
    createdAt: string
}

export interface IOffer {
    _id: string
    organizationId: string
    applicationId: string
    candidateId: string
    templateId?: string
    status: 'DRAFT' | 'SENT' | 'VIEWED' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED'
    content: string
    pdfUrl?: string
    signedPdfUrl?: string
    token?: string
    expiresAt?: string
    openedAt?: string
    acceptedAt?: string
    declinedAt?: string
    declineReason?: string
    createdAt: string
}

export interface CreateOfferInput {
    applicationId: string
    templateId: string
    variables: Record<string, any>
    expiresInDays?: number
}

export interface CreateTemplateInput {
    name: string
    content: string
    variableSchema?: Record<string, { type: string; label: string }>
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
