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
    optionalSkills?: string[]
    experienceRange?: { min: number; max: number }
    scoringConfig?: {
        version?: 'v1' | 'v2'
        weights?: {
            skills: number
            experience: number
            projects: number
            education: number
            signalBoost: number
        }
        thresholds?: {
            shortlist: number
            review: number
            autoReject: number
        }
        hardGates?: {
            requiredSkills?: string[]
            minimumExperienceYears?: number
            requiredEducationLevel?: string
        }
    }
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
    optionalSkills?: string[]
    experienceRange?: { min: number; max: number }
    salaryRange?: { min: number; max: number; currency: string }
    applicationSchema?: ApplicationSchema
    scoringConfig?: {
        version?: 'v1' | 'v2'
        weights?: {
            skills: number; experience: number; projects: number
            education: number; signalBoost: number
        }
        thresholds?: { shortlist: number; review: number; autoReject: number }
        hardGates?: {
            requiredSkills?: string[]
            minimumExperienceYears?: number
            requiredEducationLevel?: string
        }
    }
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

export interface ParsedJobData {
    requiredSkills:  string[]
    optionalSkills:  string[]
    roleType:        string
    seniorityLevel:  'Junior' | 'Mid' | 'Senior' | 'Lead' | 'Unknown'
    experienceRange: { min: number; max: number }
    educationLevel?: string
    suggestedWeights?: {
        skills: number; experience: number; projects: number
        education: number; signalBoost: number
    }
}

export const jobsApi = {
    list: (query?: ListJobsQuery) =>
        apiClient.get<Job[]>('/jobs', query as Record<string, string>),

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

    /** AI-powered JD parser */
    parseDescription: (description: string) =>
        apiClient.post<ParsedJobData>('/jobs/parse-description', { description }),

    /** Skill autocomplete suggestions */
    skillSuggestions: (q: string, role?: string) =>
        apiClient.get<string[]>('/jobs/skill-suggestions', { q, ...(role ? { role } : {}) }),
}

