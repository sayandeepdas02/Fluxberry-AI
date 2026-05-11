import { apiClient } from './client'

export type JobVisibility = 'PUBLIC' | 'PRIVATE' | 'INVITE_ONLY'
export type JobStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED'

export interface ApplicationQuestion {
    id: string
    label: string
    type: 'text' | 'textarea' | 'select' | 'checkbox' | 'file'
    required: boolean
    options?: string[]
    placeholder?: string
}

export interface Job {
    _id: string
    organizationId: string
    title: string
    description: string
    department?: string
    location?: string
    employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN' | 'OTHER'
    status: JobStatus
    visibility: JobVisibility
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
    applicationQuestions?: ApplicationQuestion[]
    assignedHiringManagerId?: string
    assignedRecruiterId?: string
    publicSlug?: string
    expiresAt?: string
    isArchived: boolean
    archivedAt?: string
    sourceJobId?: string
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
    visibility?: JobVisibility
    requirements?: string[]
    requiredSkills?: string[]
    optionalSkills?: string[]
    experienceRange?: { min: number; max: number }
    salaryRange?: { min: number; max: number; currency: string }
    applicationSchema?: ApplicationSchema
    applicationQuestions?: ApplicationQuestion[]
    assignedHiringManagerId?: string
    assignedRecruiterId?: string
    expiresAt?: string
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
    status?: JobStatus
    visibility?: JobVisibility
    search?: string
    archived?: boolean
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

    archive: (id: string) =>
        apiClient.post<Job>(`/jobs/${id}/archive`),

    unarchive: (id: string) =>
        apiClient.post<Job>(`/jobs/${id}/unarchive`),

    duplicate: (id: string) =>
        apiClient.post<Job>(`/jobs/${id}/duplicate`),

    repost: (id: string) =>
        apiClient.post<Job>(`/jobs/${id}/repost`),

    delete: (id: string) =>
        apiClient.delete<Job>(`/jobs/${id}`),

    /** AI-powered JD parser */
    parseDescription: (description: string) =>
        apiClient.post<ParsedJobData>('/jobs/parse-description', { description }),

    /** Skill autocomplete suggestions */
    skillSuggestions: (q: string, role?: string) =>
        apiClient.get<string[]>('/jobs/skill-suggestions', { q, ...(role ? { role } : {}) }),
}

