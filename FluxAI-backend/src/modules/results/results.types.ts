// ============================================
// RESPONSE TYPES
// ============================================

export interface RoundResultResponse {
    roundType: 'MCQ' | 'DSA' | 'AI'
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'EXPIRED'
    score: number | null
    maxScore: number | null
    percentage: number | null
    evaluatedAt: Date | null
}

export interface CandidateResultSummary {
    candidateId: string
    candidateEmail: string
    candidateName: string | null
    attemptId: string
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'TIMED_OUT' | 'DISQUALIFIED'
    totalScore: number
    maxScore: number
    percentage: number
    proctoringFlags: number
    startedAt: Date | null
    submittedAt: Date | null
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
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'TIMED_OUT' | 'DISQUALIFIED'
    totalScore: number
    maxScore: number
    percentage: number
    rounds: RoundResultResponse[]
    proctoringSummary: {
        totalEvents: number
        bySeverity: Record<string, number>
        byType: Record<string, number>
    }
    startedAt: Date | null
    submittedAt: Date | null
}
