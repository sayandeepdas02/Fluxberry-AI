// API Response Types (matching backend)

export interface ApiResponse<T> {
    success: boolean
    data?: T
    error?: {
        code: string
        message: string
        details?: unknown
    }
}

export interface PaginatedResponse<T> {
    data: T[]
    total: number
    page: number
    limit: number
    totalPages: number
}

// Auth Types (matching backend AuthUser, AuthTokens, AuthResponse)
export interface AuthOrganization {
    id: string
    name: string
    slug: string
    role: string
}

export interface User {
    id: string
    email: string
    firstName: string
    lastName: string
    onboardingCompleted: boolean
    organization: AuthOrganization | null
}

export interface AuthTokens {
    accessToken: string
    expiresIn: number
}

export interface LoginResponse {
    user: User
    tokens: AuthTokens
}

export interface SignupResponse {
    user: User
    tokens: AuthTokens
}

// Organization Types
export interface Organization {
    id: string
    name: string
    slug: string
    logoUrl: string | null
    website: string | null
    plan: string
    memberCount: number
    role?: string
    createdAt: string
}

// Assessment Types
export interface Assessment {
    id: string
    title: string
    description: string | null
    status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED'
    slug: string
    passingScore: number
    timeLimit: number
    allowedAttempts: number
    shuffleQuestions: boolean
    showResults: boolean
    proctoringEnabled: boolean
    rounds: AssessmentRound[]

    candidateCount?: number
    completedCount?: number
    createdAt: string
    updatedAt: string
}

export interface PipelineStage {
    _id: string
    jobId: string
    organizationId: string
    name: string
    type: string
    order: number
    color: string
    isDefault: boolean
    createdAt: string
    updatedAt: string
}

export interface AssessmentRound {
    id: string
    roundType: 'MCQ' | 'DSA' | 'AI'
    order: number
    enabled: boolean
    timeLimit: number
    config: Record<string, unknown>
}

// Question Types
export interface Question {
    id: string
    type: 'MCQ' | 'DSA' | 'AI'
    title: string
    difficulty: 'EASY' | 'MEDIUM' | 'HARD'
    topics: string[]
    metadata: {
        content?: string
        options?: { id: string; text: string }[]
        correctOptions?: string[]
        starterCode?: string
        testCases?: unknown[]
    }
}

// Attempt Types
export interface AssessmentAttempt {
    id: string
    assessmentId: string
    candidateId: string
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'EVALUATED'
    startedAt: string | null
    submittedAt: string | null
    currentRound: string | null
    rounds: AttemptRound[]
}

// Timing mode determines which timer to display
export type TimingMode = 'PER_QUESTION' | 'PER_ROUND'

export interface AttemptRound {
    id: string
    roundType: 'MCQ' | 'DSA' | 'AI'
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED'
    startedAt: string | null
    submittedAt: string | null
    timeSpentSeconds: number
    timingMode: TimingMode // NEW: determines which timer is shown
    timeLimit: number | null // Only valid for PER_ROUND
    perQuestionTimeLimit?: number // Only valid for PER_QUESTION
    answers: Record<string, unknown>
}

// Result Types
export interface AttemptResult {
    attempt: {
        id: string
        status: string
        startedAt: string | null
        submittedAt: string | null
    }
    rounds: RoundResult[]
    totalScore: number
    maxScore: number
    percentage: number
    proctoring?: {
        totalEvents: number
        flagged: boolean
    }
}

export interface RoundResult {
    roundType: string
    status: string
    timeSpentSeconds: number
    evaluation: {
        score: number
        maxScore: number
        metadata: Record<string, unknown>
    } | null
}
