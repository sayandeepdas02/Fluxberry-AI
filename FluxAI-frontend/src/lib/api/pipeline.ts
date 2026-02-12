import { apiClient } from './client'
import { ApiResponse, PipelineStage } from './types'

export const pipelineApi = {
    getStages: async (jobId: string): Promise<ApiResponse<PipelineStage[]>> => {
        return apiClient.get(`/jobs/${jobId}/stages`)
    },

    addStage: async (jobId: string, data: { name: string; color?: string; afterOrder?: number }): Promise<ApiResponse<PipelineStage>> => {
        return apiClient.post(`/jobs/${jobId}/stages`, data)
    },

    reorderStages: async (jobId: string, stageIds: string[]): Promise<ApiResponse<PipelineStage[]>> => {
        return apiClient.patch(`/jobs/${jobId}/stages/reorder`, { stageIds })
    },

    removeStage: async (jobId: string, stageId: string): Promise<ApiResponse<{ message: string }>> => {
        return apiClient.delete(`/jobs/${jobId}/stages/${stageId}`)
    },
}
