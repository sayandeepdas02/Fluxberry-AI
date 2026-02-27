import { apiClient } from './client'

export interface AtsScreeningOverview {
    totalApplicants: number
    autoShortlisted: number
    needsReview: number
    rejected: number
    screeningInProgress: number
}

export interface AtsHistogramBin {
    range: string
    count: number
}

export interface AtsJobStatsResponse {
    overview: AtsScreeningOverview
    histogram: AtsHistogramBin[]
    percentiles: {
        p50: number
        p75: number
        p90: number
    }
}

export interface AtsCandidate {
    id: string
    name: string
    score: number
    confidence: number
    decision: 'SHORTLISTED' | 'REVIEW' | 'REJECTED' | 'PENDING' | 'ERROR'
    status: string
}

export interface AtsCandidatesListResponse {
    data: AtsCandidate[]
    pagination: {
        total: number
        page: number
        limit: number
        pages: number
    }
}

export interface AtsScoreBreakdownData {
    radarData: { subject: string; A: number; fullMark: number }[]
    hardGateFailureReason?: string
    status: string
    finalScore: number
    confidenceScore: number
    scoringVersion: string
}

export interface AtsJobProfile {
    _id: string
    jobId: string
    organizationId: string
    thresholds: {
        shortlist: number
        reviewZone: number
        autoReject: number
    }
}

export const atsScreeningApi = {
    getJobStats: (jobId: string) =>
        apiClient.get<AtsJobStatsResponse>(`/ats-screening/${jobId}/stats`),

    getCandidates: (jobId: string, page = 1, limit = 20) =>
        apiClient.get<AtsCandidatesListResponse>(`/ats-screening/${jobId}/candidates`, { page: page.toString(), limit: limit.toString() }),

    getCandidateBreakdown: (jobId: string, candidateId: string) =>
        apiClient.get<{ breakdown: AtsScoreBreakdownData }>(`/ats-screening/${jobId}/candidates/${candidateId}/breakdown`).then(res => res.data?.breakdown),

    overrideDecision: (jobId: string, candidateId: string, decision: 'SHORTLISTED' | 'REVIEW' | 'REJECTED', reason?: string) =>
        apiClient.post(`/ats-screening/${jobId}/candidates/${candidateId}/override`, { decision, reason }),

    getJobProfile: (jobId: string) =>
        apiClient.get<{ profile: AtsJobProfile }>(`/ats-screening/${jobId}/profile`),

    updateJobProfile: (jobId: string, data: Partial<AtsJobProfile>) =>
        apiClient.put<{ profile: AtsJobProfile }>(`/ats-screening/${jobId}/profile`, data),
}
