import { apiClient } from './client'
import { ApiResponse } from './types'

export interface Job {
    _id: string
    organizationId: string
    title: string
    description: string
    department: string
    location: string
    type: 'FULL_TIME' | 'CONTRACT' | 'INTERNSHIP' | 'PART_TIME'
    status: 'OPEN' | 'CLOSED' | 'DRAFT'
    requirements?: string[]
    salaryRange?: {
        min: number
        max: number
        currency: string
    }
    createdAt: string
    updatedAt: string
}

export interface CreateJobInput {
    title: string
    description: string
    department: string
    location: string
    type: Job['type']
    status?: Job['status']
    requirements?: string[]
    salaryRange?: {
        min: number
        max: number
        currency: string
    }
}

export interface UpdateJobInput extends Partial<CreateJobInput> { }

export const jobsApi = {
    list: async (): Promise<ApiResponse<Job[]>> => {
        return apiClient.get('/jobs')
    },

    getById: async (id: string): Promise<ApiResponse<Job>> => {
        return apiClient.get(`/jobs/${id}`)
    },

    create: async (data: CreateJobInput): Promise<ApiResponse<Job>> => {
        return apiClient.post('/jobs', data)
    },

    update: async (id: string, data: UpdateJobInput): Promise<ApiResponse<Job>> => {
        return apiClient.patch(`/jobs/${id}`, data)
    },
}
