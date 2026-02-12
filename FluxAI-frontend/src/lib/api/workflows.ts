import { apiClient } from './client'
import { IWorkflowRule } from '../../features/workflow/types'

export const workflowsApi = {
    list: (query?: any) =>
        apiClient.get<IWorkflowRule[]>('/workflows', query),

    getById: (id: string) =>
        apiClient.get<IWorkflowRule>(`/workflows/${id}`),

    create: (data: Partial<IWorkflowRule>) =>
        apiClient.post<IWorkflowRule>('/workflows', data),

    update: (id: string, data: Partial<IWorkflowRule>) =>
        apiClient.patch<IWorkflowRule>(`/workflows/${id}`, data),

    delete: (id: string) =>
        apiClient.delete(`/workflows/${id}`),
}
