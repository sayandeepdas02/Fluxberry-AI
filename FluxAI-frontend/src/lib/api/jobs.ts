import { apiClient } from './client'

export interface Job {
    _id: string
    organizationId: string
    title: string
    description: string
    department?: string
    location?: string
    employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN' | 'OTHER'
    status: 'DRAFT' | 'PUBLISHED' | 'CLOSED'
    requirements?: string[]
    requiredSkills?: string[]
    salaryRange?: { min: number; max: number; currency: string }
    applicationSchema?: ApplicationSchema
    publicSlug?: string
    createdBy?: string
    publishedAt?: string
    closedAt?: string
    applicationCount?: number
    createdAt: string
    updatedAt: string
}

export interface ApplicationField {
    name: string
    label: string
    type: 'text' | 'email' | 'number' | 'file' | 'select' | 'textarea'
    required?: boolean
    options?: string[]
}

export interface ApplicationSchema {
    fields: ApplicationField[]
}

export interface CreateJobInput {
    title: string
    description: string
    department?: string
    location?: string
    employmentType?: string
    requirements?: string[]
    requiredSkills?: string[]
    salaryRange?: { min: number; max: number; currency: string }
    applicationSchema?: ApplicationSchema
}

export type UpdateJobInput = Partial<CreateJobInput>

export interface ListJobsQuery {
    page?: number
    limit?: number
    status?: 'DRAFT' | 'PUBLISHED' | 'CLOSED'
    search?: string
}

export interface ListJobsResponse {
    jobs: Job[]
    total: number
    page: number
    totalPages: number
}

export const jobsApi = {
    list: (query?: ListJobsQuery) =>
        apiClient.get<ListJobsResponse>('/jobs', query as Record<string, string>),

    getById: (id: string) =>
        apiClient.get<Job>(`/jobs/${id}`),

    create: (input: CreateJobInput) =>
        apiClient.post<Job>('/jobs', input),

    update: (id: string, input: UpdateJobInput) =>
        apiClient.patch<Job>(`/jobs/${id}`, input),

    publish: (id: string) =>
        apiClient.post<Job>(`/jobs/${id}/publish`),

    close: (id: string) =>
        apiClient.post<Job>(`/jobs/${id}/close`),

    delete: (id: string) =>
        apiClient.delete<Job>(`/jobs/${id}`),
}
