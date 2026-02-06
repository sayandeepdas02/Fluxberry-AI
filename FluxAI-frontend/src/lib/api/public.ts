import { apiClient } from './client'
import { ApiResponse } from './types'

export interface PublicCompany {
    _id: string
    name: string
    slug: string
    logoUrl?: string
    website?: string
    branding?: {
        primaryColor?: string
    }
}

export interface PublicJob {
    _id: string
    title: string
    description: string
    department?: string
    location?: string
    type?: string
    salaryRange?: {
        min: number
        max: number
        currency: string
    }
    createdAt: string
}

export const publicApi = {
    getCompany: async (slug: string): Promise<ApiResponse<PublicCompany>> => {
        return apiClient.get(`/public/companies/${slug}`)
    },

    getCompanyJobs: async (slug: string): Promise<ApiResponse<PublicJob[]>> => {
        return apiClient.get(`/public/companies/${slug}/jobs`)
    },

    getJob: async (slug: string, jobId: string): Promise<ApiResponse<PublicJob>> => {
        return apiClient.get(`/public/companies/${slug}/jobs/${jobId}`)
    }
}
