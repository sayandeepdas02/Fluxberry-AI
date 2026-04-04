import { apiClient } from './client'
import { ApiResponse } from './types'

// ── Types ──────────────────────────────────────────────────

export interface Prospect {
    _id: string
    organizationId: string
    firstName: string
    lastName: string
    email: string
    phone?: string
    company?: string
    role?: string
    location?: string
    experience?: number
    skills?: string[]
    linkedinUrl?: string
    source: string
    status: 'new' | 'contacted' | 'replied' | 'converted'
    convertedCandidateId?: string
    createdAt: string
    updatedAt: string
}

export interface ProspectList {
    _id: string
    organizationId: string
    name: string
    description?: string
    prospectIds: Prospect[] | string[]
    createdAt: string
}

export interface Campaign {
    _id: string
    organizationId: string
    name: string
    listId: { _id: string; name: string } | string
    templateId: { _id: string; name: string; subject: string } | string
    status: 'draft' | 'sending' | 'completed' | 'paused'
    stats: { sent: number; opened: number; replied: number; bounced: number }
    createdAt: string
}

export interface CampaignMessage {
    _id: string
    campaignId: string
    prospectId: { _id: string; firstName: string; lastName: string; email: string } | string
    status: 'queued' | 'sent' | 'opened' | 'replied' | 'bounced'
    sentAt?: string
}

export interface ListProspectsQuery {
    page?: number
    limit?: number
    search?: string
    status?: string
    company?: string
    role?: string
    location?: string
    skills?: string
}

// ── API ────────────────────────────────────────────────────

export const prospectsApi = {
    // Prospects
    list: (query?: ListProspectsQuery): Promise<ApiResponse<Prospect[]>> =>
        apiClient.get('/prospects', query as Record<string, string>),

    getById: (id: string): Promise<ApiResponse<Prospect>> =>
        apiClient.get(`/prospects/${id}`),

    create: (data: Partial<Prospect>): Promise<ApiResponse<Prospect>> =>
        apiClient.post('/prospects', data),

    createBulk: (prospects: Partial<Prospect>[]): Promise<ApiResponse<{ inserted: number }>> =>
        apiClient.post('/prospects/bulk', { prospects }),

    update: (id: string, data: Partial<Prospect>): Promise<ApiResponse<Prospect>> =>
        apiClient.patch(`/prospects/${id}`, data),

    convertToCandidate: (id: string): Promise<ApiResponse<{ candidate: any; alreadyExisted: boolean }>> =>
        apiClient.post(`/prospects/${id}/convert`),

    // Lists
    listLists: (): Promise<ApiResponse<ProspectList[]>> =>
        apiClient.get('/prospects/lists/all'),

    createList: (data: { name: string; description?: string }): Promise<ApiResponse<ProspectList>> =>
        apiClient.post('/prospects/lists', data),

    getListById: (id: string): Promise<ApiResponse<ProspectList>> =>
        apiClient.get(`/prospects/lists/${id}`),

    addToList: (listId: string, prospectIds: string[]): Promise<ApiResponse<ProspectList>> =>
        apiClient.post(`/prospects/lists/${listId}/add`, { prospectIds }),

    removeFromList: (listId: string, prospectIds: string[]): Promise<ApiResponse<ProspectList>> =>
        apiClient.post(`/prospects/lists/${listId}/remove`, { prospectIds }),

    // Campaigns
    listCampaigns: (): Promise<ApiResponse<Campaign[]>> =>
        apiClient.get('/prospects/campaigns/all'),

    createCampaign: (data: { name: string; listId: string; templateId: string }): Promise<ApiResponse<Campaign>> =>
        apiClient.post('/prospects/campaigns', data),

    getCampaignById: (id: string): Promise<ApiResponse<Campaign>> =>
        apiClient.get(`/prospects/campaigns/${id}`),

    sendCampaign: (id: string): Promise<ApiResponse<{ sent: number; total: number }>> =>
        apiClient.post(`/prospects/campaigns/${id}/send`),

    getCampaignMessages: (id: string): Promise<ApiResponse<CampaignMessage[]>> =>
        apiClient.get(`/prospects/campaigns/${id}/messages`),
}
