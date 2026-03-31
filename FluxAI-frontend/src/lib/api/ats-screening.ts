import { apiClient } from './client'

// ─────────────────────────────────────────────
// Enums (mirrored from backend)
// ─────────────────────────────────────────────

export const ScreeningStatus = {
    PENDING:             'PENDING',
    PASSED:              'PASSED',
    FAILED_GATE:         'FAILED_GATE',
    ERROR:               'ERROR',
    AWAITING_PARSE:      'AWAITING_PARSE',
    PARSE_FAILED:        'PARSE_FAILED',
    SCORING_IN_PROGRESS: 'SCORING_IN_PROGRESS',
    SCORED:              'SCORED',
} as const

export type ScreeningStatusType = typeof ScreeningStatus[keyof typeof ScreeningStatus]

export type ParseErrorReason = 'PARSE_TIMEOUT' | 'INVALID_FORMAT' | null

// ─────────────────────────────────────────────
// Response Types
// ─────────────────────────────────────────────

export interface AtsScreeningOverview {
    totalApplicants: number
    autoShortlisted: number
    needsReview: number
    rejected: number
    screeningInProgress: number
    parseFailed: number
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
    avgScore: number
}

export interface AtsCandidate {
    id: string
    name: string
    score: number
    confidence: number
    decision: 'SHORTLISTED' | 'REVIEW' | 'REJECTED' | 'PENDING' | 'ERROR' | 'PARSE_FAILED'
    status: ScreeningStatusType
    statusPriority?: number
    errorReason?: ParseErrorReason
    isOverridden?: boolean
    isTop10?: boolean
    overrideReason?: string | null
    overrideAt?: string | null
    scoreBreakdown?: {
        skillScore: number
        experienceScore: number
        projectScore: number
        educationScore: number
    } | null
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

export interface SkillMatchDetail {
    skill: string
    bestMatch: string
    similarity: number
    strength: 'strong' | 'partial' | 'none'
}

export interface AtsExplanation {
    strengths: string[]
    weaknesses: string[]
    summary: string
}

export interface AtsScoreBreakdownData {
    radarData: { subject: string; A: number; fullMark: number }[]
    hardGateFailureReason?: string
    status: ScreeningStatusType
    errorReason?: ParseErrorReason
    finalScore: number
    confidenceScore: number
    scoringVersion: string
    // V2 extensions
    insights?: string[]
    skillMatchDetails?: SkillMatchDetail[]
    signalBoostScore?: number
    explanation?: AtsExplanation
    manualOverride?: {
        decision: string
        reason?: string
        updatedAt?: string
    } | null
    weights?: AtsWeights
}

export interface AtsWeights {
    skills: number
    experience: number
    projects: number
    education: number
    signalBoost: number
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
    weights?: {
        skillWeight: number
        experienceWeight: number
        projectWeight: number
        educationWeight: number
        bonusWeight: number
    }
}

export interface FeedbackSummary {
    totalPositive: number
    totalNegative: number
    preferredSkills: { skill: string; positiveCount: number; negativeCount: number; netSignal: number }[]
    avoidedSkills: { skill: string; positiveCount: number; negativeCount: number; netSignal: number }[]
    avgScores: {
        positive: { skill: number; experience: number; project: number; education: number } | null
        negative: { skill: number; experience: number; project: number; education: number } | null
    }
    suggestions: { dimension: string; currentWeight: number; suggestedDelta: number; reason: string }[]
}

export interface AtsFilterParams {
    search?: string
    decision?: string
    scoreMin?: number
    scoreMax?: number
}

// ─────────────────────────────────────────────
// API Client
// ─────────────────────────────────────────────

export const atsScreeningApi = {
    getJobStats: (jobId: string) =>
        apiClient.get<AtsJobStatsResponse>(`/ats-screening/${jobId}/stats`),

    getCandidates: (jobId: string, page = 1, limit = 20, filters?: AtsFilterParams) => {
        const params: Record<string, string> = {
            page: page.toString(),
            limit: limit.toString(),
        }
        if (filters?.search) params.search = filters.search
        if (filters?.decision) params.decision = filters.decision
        if (filters?.scoreMin != null) params.scoreMin = filters.scoreMin.toString()
        if (filters?.scoreMax != null) params.scoreMax = filters.scoreMax.toString()

        return apiClient.get<AtsCandidatesListResponse>(
            `/ats-screening/${jobId}/candidates`,
            params,
        )
    },

    getCandidateBreakdown: (jobId: string, candidateId: string) =>
        apiClient
            .get<{ breakdown: AtsScoreBreakdownData }>(`/ats-screening/${jobId}/candidates/${candidateId}/breakdown`)
            .then(res => res.data?.breakdown),

    overrideDecision: (
        jobId: string,
        candidateId: string,
        decision: 'SHORTLISTED' | 'REVIEW' | 'REJECTED',
        reason?: string
    ) =>
        apiClient.post(`/ats-screening/${jobId}/candidates/${candidateId}/override`, { decision, reason }),

    bulkOverride: (
        jobId: string,
        candidateIds: string[],
        decision: 'SHORTLISTED' | 'REVIEW' | 'REJECTED',
        reason?: string
    ) =>
        apiClient.post(`/ats-screening/${jobId}/candidates/bulk-override`, { candidateIds, decision, reason }),

    retryParseFailed: (jobId: string, candidateId: string) =>
        apiClient.post(`/ats-screening/${jobId}/candidates/${candidateId}/retry-parse`, {}),

    getJobProfile: (jobId: string) =>
        apiClient.get<{ profile: AtsJobProfile }>(`/ats-screening/${jobId}/profile`),

    updateJobProfile: (jobId: string, data: Partial<AtsJobProfile>) =>
        apiClient.put<{ profile: AtsJobProfile }>(`/ats-screening/${jobId}/profile`, data),

    // Part 1: Weights
    getWeights: (jobId: string) =>
        apiClient.get<{ weights: AtsWeights }>(`/ats-screening/${jobId}/weights`),

    updateWeights: (jobId: string, weights: AtsWeights) =>
        apiClient.put<{ weights: AtsWeights }>(`/ats-screening/${jobId}/weights`, weights),

    // Part 5: Feedback
    getFeedbackSummary: (jobId: string) =>
        apiClient.get<{ summary: FeedbackSummary }>(`/ats-screening/${jobId}/feedback-summary`),
}
