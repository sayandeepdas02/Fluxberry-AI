import { apiClient } from './client'

export interface IEmailTemplate {
    _id: string
    organizationId: string
    name: string
    subject: string
    content: string
    variables: string[]
    isActive: boolean
    createdAt: string
    updatedAt: string
}

export const emailTemplatesApi = {
    list: () =>
        apiClient.get<IEmailTemplate[]>('/email-templates'),

    getById: (id: string) =>
        apiClient.get<IEmailTemplate>(`/email-templates/${id}`),

    create: (data: Partial<IEmailTemplate>) =>
        apiClient.post<IEmailTemplate>('/email-templates', data),

    update: (id: string, data: Partial<IEmailTemplate>) =>
        apiClient.patch<IEmailTemplate>(`/email-templates/${id}`, data),

    delete: (id: string) =>
        apiClient.delete(`/email-templates/${id}`),
}
