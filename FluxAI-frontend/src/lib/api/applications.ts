import { apiClient } from './client'
import { ApiResponse } from './types'

export type ApplicationStage = 'APPLIED' | 'SCREENING' | 'INTERVIEW' | 'OFFER' | 'HIRED' | 'REJECTED'

export interface ApplicationCandidate {
    _id: string
    firstName?: string
    lastName?: string
    email: string
    phone?: string
    resumeUrl?: string
}

export interface ApplicationJob {
    _id: string
    title: string
}

export interface JobApplicationResponse {
    _id: string
    organizationId: string
    jobId: ApplicationJob | string
    candidateId: ApplicationCandidate | string
    applicationData?: Record<string, unknown>
    resumeUrl?: string
    status: ApplicationStage
    currentStageId?: {
        _id: string
        name: string
        type: string
        color: string
        order: number
    }
    submittedAt: string
    createdAt: string
    updatedAt: string
}

export interface ListApplicationsQuery {
    page?: number
    limit?: number
    stage?: ApplicationStage
    search?: string
    sort?: 'appliedAt' | '-appliedAt' | 'name' | '-name'
}

export interface ListApplicationsResponse {
    applications: JobApplicationResponse[]
    total: number
    page: number
    limit: number
}

export interface BulkUpdateInput {
    applicationIds: string[]
    action: 'MOVE_STAGE' | 'REJECT'
    stage?: ApplicationStage
}

export interface BulkUpdateResponse {
    updated: number
    errors: string[]
}

export const applicationsApi = {
    listByJob: async (jobId: string, query?: ListApplicationsQuery): Promise<ApiResponse<ListApplicationsResponse>> => {
        return apiClient.get(`/jobs/${jobId}/applications`, query as Record<string, string>)
    },

    getById: async (id: string): Promise<ApiResponse<JobApplicationResponse>> => {
        return apiClient.get(`/applications/${id}`)
    },

    // Legacy: string-based status
    updateStage: async (id: string, stage: ApplicationStage): Promise<ApiResponse<JobApplicationResponse>> => {
        return apiClient.patch(`/applications/${id}/stage`, { stage })
    },

    // New: stage-ID based
    moveStage: async (id: string, stageId: string): Promise<ApiResponse<JobApplicationResponse>> => {
        return apiClient.patch(`/applications/${id}/move-stage`, { stageId })
    },

    // Legacy: string-based bulk update
    bulkUpdate: async (input: BulkUpdateInput): Promise<ApiResponse<BulkUpdateResponse>> => {
        return apiClient.post('/applications/bulk-update', input)
    },

    // New: stage-ID based bulk move
    bulkMove: async (applicationIds: string[], stageId: string): Promise<ApiResponse<BulkUpdateResponse>> => {
        return apiClient.post('/applications/bulk-move', { applicationIds, stageId })
    },
}
