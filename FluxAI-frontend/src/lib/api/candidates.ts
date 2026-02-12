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

export interface StageHistoryEntry {
    _id: string
    applicationId: string
    fromStage: string | null
    toStage: string
    changedBy: { _id: string; firstName: string; lastName: string }
    changedAt: string
}

export interface CandidateNoteEntry {
    _id: string
    candidateId: string
    authorId: { _id: string; firstName: string; lastName: string; email: string }
    content: string
    createdAt: string
}

export interface CandidateApplication {
    _id: string
    jobId: { _id: string; title: string; status: string; department?: string; location?: string }
    status: string
    applicationData?: Record<string, unknown>
    resumeUrl?: string
    submittedAt: string
}

export interface CandidateDetailResponse {
    candidate: Candidate
    applications: CandidateApplication[]
    notes: CandidateNoteEntry[]
    stageHistory: StageHistoryEntry[]
    assessmentHistory: any[]
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
    jobId?: string
    stage?: string
    dateFrom?: string
    dateTo?: string
    tags?: string
}

export const candidatesApi = {
    list: async (query?: ListCandidatesQuery): Promise<ApiResponse<{ candidates: Candidate[], total: number, page: number, totalPages: number }>> => {
        return apiClient.get('/candidates', query)
    },

    getById: async (id: string): Promise<ApiResponse<CandidateDetailResponse>> => {
        return apiClient.get(`/candidates/${id}`)
    },

    create: async (data: CreateCandidateInput): Promise<ApiResponse<Candidate>> => {
        return apiClient.post('/candidates', data)
    },

    update: async (id: string, data: UpdateCandidateInput): Promise<ApiResponse<Candidate>> => {
        return apiClient.patch(`/candidates/${id}`, data)
    },

    addNote: async (id: string, content: string): Promise<ApiResponse<CandidateNoteEntry>> => {
        return apiClient.post(`/candidates/${id}/notes`, { content })
    },
}

