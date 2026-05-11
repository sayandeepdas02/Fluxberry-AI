import { apiClient } from './client'
import type { ApplicationSchema, ApplicationQuestion } from './jobs'

// ──────────────────────────────────────────────────────────────
// Public types (unauthenticated pages)
// ──────────────────────────────────────────────────────────────

export interface PublicCompany {
    _id:       string
    name:      string
    slug:      string
    logoUrl?:  string
    website?:  string
    branding?: Record<string, unknown>
}

/** Full job detail (used on /jobs/[slug]) */
export interface PublicJob {
    _id:            string
    title:          string
    description:    string
    department?:    string
    location?:      string
    employmentType?: string
    requiredSkills?: string[]
    optionalSkills?: string[]
    experienceRange?: { min: number; max: number }
    requirements?:  string[]
    salaryRange?:   { min: number; max: number; currency: string }
    applicationSchema?: ApplicationSchema
    applicationQuestions?: ApplicationQuestion[]
    publicSlug?:    string
    expiresAt?:     string
    publishedAt?:   string
    company?:       PublicCompany
}

/** Card-safe subset returned by the listing endpoint */
export interface PublicJobCard {
    _id:             string
    title:           string
    department?:     string
    location?:       string
    employmentType?: string
    requiredSkills?: string[]
    optionalSkills?: string[]
    experienceRange?: { min: number; max: number }
    salaryRange?:    { min: number; max: number; currency: string }
    publicSlug?:     string
    publishedAt?:    string
    company?:        PublicCompany
}

export interface PublicJobsListResponse {
    jobs:       PublicJobCard[]
    total:      number
    page:       number
    totalPages: number
}

export interface PublicJobListQuery {
    search?:         string
    location?:       string
    employmentType?: string
    remote?:         boolean
    expMin?:         number
    page?:           number
    limit?:          number
}

export interface ApplicationSubmission {
    firstName?:      string
    lastName?:       string
    email:           string
    phone?:          string
    applicationData: Record<string, unknown>
    resumeFileId?:   string
}

export interface ApplicationResponse {
    applicationId: string
    message:       string
}

export interface ResumeUploadResponse {
    uploadUrl:  string
    storageKey: string
    expiresIn:  number
}

export interface RunCodeResponse {
    stdout:             string
    stderr:             string
    exitCode?:          number
    time?:              number
    memory?:            number
    compileError?:      string
    statusDescription?: string
    timeSeconds?:       number
    memoryKb?:          number
}

// ──────────────────────────────────────────────────────────────
// Public API client (no auth required)
// ──────────────────────────────────────────────────────────────

const PUBLIC_BASE = '/public'

function buildQueryString(q: Record<string, unknown>): Record<string, string> {
    const out: Record<string, string> = {}
    for (const [k, v] of Object.entries(q)) {
        if (v !== undefined && v !== null && v !== '') {
            out[k] = String(v)
        }
    }
    return out
}

export const publicApi = {
    /** Global job board listing — search + filter + paginate */
    listJobs: (query?: PublicJobListQuery) =>
        apiClient.get<PublicJobsListResponse>(`${PUBLIC_BASE}/jobs`, buildQueryString((query ?? {}) as Record<string, unknown>)),


    /** Full job detail by publicSlug */
    getJobBySlug: (slug: string) =>
        apiClient.get<PublicJob>(`${PUBLIC_BASE}/jobs/${slug}`),

    /** Company info + jobs for brand page */
    getCompany: (slug: string) =>
        apiClient.get<PublicCompany>(`${PUBLIC_BASE}/companies/${slug}`),

    getCompanyJobs: (slug: string) =>
        apiClient.get<PublicJobCard[]>(`${PUBLIC_BASE}/companies/${slug}/jobs`),

    getJob: (companySlug: string, jobId: string) =>
        apiClient.get<PublicJob>(`${PUBLIC_BASE}/companies/${companySlug}/jobs/${jobId}`),

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

