import { apiClient } from './client'
import type { ApplicationSchema } from './jobs'

// Public types (for unauthenticated pages)
export interface PublicCompany {
    _id: string
    name: string
    slug: string
    logoUrl?: string
    website?: string
    branding?: Record<string, unknown>
}

export interface PublicJob {
    _id: string
    title: string
    description: string
    department?: string
    location?: string
    employmentType?: string
    requiredSkills?: string[]
    requirements?: string[]
    salaryRange?: { min: number; max: number; currency: string }
    applicationSchema?: ApplicationSchema
    publicSlug?: string
    publishedAt?: string
    company?: PublicCompany
}

export interface ApplicationSubmission {
    firstName?: string
    lastName?: string
    email: string
    phone?: string
    applicationData: Record<string, unknown>
    resumeFileId?: string
}

export interface ApplicationResponse {
    applicationId: string
    message: string
}

export interface ResumeUploadResponse {
    uploadUrl: string
    storageKey: string
    expiresIn: number
}

export interface RunCodeResponse {
    stdout: string
    stderr: string
    /** Program exit code from Judge0 (optional for backwards compatibility). */
    exitCode?: number
    time?: number
    memory?: number
    compileError?: string
    statusDescription?: string
    timeSeconds?: number
    memoryKb?: number
}

// Public API client (no auth required)
const PUBLIC_BASE = '/public'

export const publicApi = {
    getCompany: (slug: string) =>
        apiClient.get<PublicCompany>(`${PUBLIC_BASE}/companies/${slug}`),

    getCompanyJobs: (slug: string) =>
        apiClient.get<PublicJob[]>(`${PUBLIC_BASE}/companies/${slug}/jobs`),

    getJob: (companySlug: string, jobId: string) =>
        apiClient.get<PublicJob>(`${PUBLIC_BASE}/companies/${companySlug}/jobs/${jobId}`),

    // New: by publicSlug
    getJobBySlug: (slug: string) =>
        apiClient.get<PublicJob>(`${PUBLIC_BASE}/jobs/${slug}`),

    submitApplication: (slug: string, data: ApplicationSubmission) =>
        apiClient.post<ApplicationResponse>(`${PUBLIC_BASE}/jobs/${slug}/apply`, data),

    requestResumeUpload: (slug: string, body: { mimeType: string; size: number }) =>
        apiClient.post<ResumeUploadResponse>(`${PUBLIC_BASE}/jobs/${slug}/upload-resume`, body),

    // Assessment / code routes
    getAssessment: (id: string) =>
        apiClient.get<unknown>(`${PUBLIC_BASE}/assessments/${id}`),

    runCode: (body: { code: string; language: string; stdin?: string }) =>
        apiClient.post<RunCodeResponse>(`${PUBLIC_BASE}/run-code`, body),
}
