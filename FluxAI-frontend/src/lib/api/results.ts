import { apiClient } from './client'

// Aligned with backend results.types.ts
export interface RoundResultResponse {
    roundType: 'MCQ' | 'DSA' | 'AI'
    status: string
    score: number | null
    maxScore: number | null
    percentage: number | null
    evaluatedAt: string | null
}

export interface CandidateResultSummary {
    candidateId: string
    candidateEmail: string
    candidateName: string | null
    attemptId: string
    status: string
    totalScore: number
    maxScore: number
    percentage: number
    proctoringFlags: number
    startedAt: string | null
    submittedAt: string | null
}

export interface AssessmentResultsResponse {
    assessmentId: string
    assessmentTitle: string
    totalCandidates: number
    completedCount: number
    results: CandidateResultSummary[]
}

export interface AttemptResultResponse {
    attemptId: string
    assessmentId: string
    assessmentTitle: string
    candidateId: string
    candidateEmail: string
    candidateName: string | null
    status: string
    totalScore: number
    maxScore: number
    percentage: number
    rounds: RoundResultResponse[]
    proctoringSummary: {
        totalEvents: number
        bySeverity: Record<string, number>
        byType: Record<string, number>
    }
    startedAt: string | null
    submittedAt: string | null
}

export const resultsApi = {
    /**
     * Get all candidate results for an assessment (recruiter dashboard).
     * Requires auth.
     */
    getAssessmentResults(assessmentId: string) {
        return apiClient.get<AssessmentResultsResponse>(`/assessments/${assessmentId}/results`)
    },

    /**
     * Get detailed result for a single attempt (candidate report).
     * Public (no auth) so candidate can view own result via link.
     */
    getAttemptResult(attemptId: string) {
        return apiClient.get<AttemptResultResponse>(`/attempts/${attemptId}/result`)
    },
}
