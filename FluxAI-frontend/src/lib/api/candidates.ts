import { apiClient } from './client'
import { ApiResponse } from './types'

export interface Candidate {
    _id: string
    organizationId: string
    email: string
    firstName?: string
    lastName?: string
    phone?: string
    source?: string
    createdAt: string
    updatedAt: string
}

export interface CreateCandidateInput {
    email: string
    firstName?: string
    lastName?: string
    phone?: string
    source?: string
}

export interface UpdateCandidateInput extends Partial<CreateCandidateInput> { }

export interface ListCandidatesQuery {
    page?: number
    limit?: number
    search?: string
    source?: string
}

export const candidatesApi = {
    list: async (query?: ListCandidatesQuery): Promise<ApiResponse<{ candidates: Candidate[], total: number, page: number, totalPages: number }>> => {
        return apiClient.get('/candidates', query)
    },

    getById: async (id: string): Promise<ApiResponse<{ candidate: Candidate, history: any[] }>> => {
        return apiClient.get(`/candidates/${id}`)
    },

    create: async (data: CreateCandidateInput): Promise<ApiResponse<Candidate>> => {
        return apiClient.post('/candidates', data)
    },

    update: async (id: string, data: UpdateCandidateInput): Promise<ApiResponse<Candidate>> => {
        return apiClient.patch(`/candidates/${id}`, data)
    },
}
