import mongoose, { Schema, Document, Types } from 'mongoose'

// Enums
export const MemberRole = {
    OWNER: 'OWNER',
    ADMIN: 'ADMIN',
    RECRUITER: 'RECRUITER',
} as const
export type MemberRoleType = typeof MemberRole[keyof typeof MemberRole]

export const Plan = {
    FREE: 'FREE',
    PRO: 'PRO',
    ENTERPRISE: 'ENTERPRISE',
} as const
export type PlanType = typeof Plan[keyof typeof Plan]

export const AssessmentStatus = {
    DRAFT: 'DRAFT',
    ACTIVE: 'ACTIVE',
    CLOSED: 'CLOSED',
} as const
export type AssessmentStatusType = typeof AssessmentStatus[keyof typeof AssessmentStatus]

export const RoundType = {
    MCQ: 'MCQ',
    DSA: 'DSA',
    AI: 'AI',
} as const
export type RoundTypeValue = typeof RoundType[keyof typeof RoundType]

export const QuestionType = {
    MCQ: 'MCQ',
    DSA: 'DSA',
} as const
export type QuestionTypeValue = typeof QuestionType[keyof typeof QuestionType]

export const Difficulty = {
    EASY: 'EASY',
    MEDIUM: 'MEDIUM',
    HARD: 'HARD',
} as const
export type DifficultyType = typeof Difficulty[keyof typeof Difficulty]

export const AttemptStatus = {
    NOT_STARTED: 'NOT_STARTED',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    TIMED_OUT: 'TIMED_OUT',
    DISQUALIFIED: 'DISQUALIFIED',
} as const
export type AttemptStatusType = typeof AttemptStatus[keyof typeof AttemptStatus]

export const RoundStatus = {
    NOT_STARTED: 'NOT_STARTED',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    SKIPPED: 'SKIPPED',
    EXPIRED: 'EXPIRED',
} as const
export type RoundStatusType = typeof RoundStatus[keyof typeof RoundStatus]

export const QuestionStatus = {
    NOT_STARTED: 'NOT_STARTED',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    EXPIRED: 'EXPIRED',
} as const
export type QuestionStatusType = typeof QuestionStatus[keyof typeof QuestionStatus]

export const ProctoringEventType = {
    TAB_SWITCH: 'TAB_SWITCH',
    FACE_NOT_DETECTED: 'FACE_NOT_DETECTED',
    MULTIPLE_FACES: 'MULTIPLE_FACES',
    MIC_MUTED: 'MIC_MUTED',
    FULLSCREEN_EXIT: 'FULLSCREEN_EXIT',
} as const
export type ProctoringEventTypeValue = typeof ProctoringEventType[keyof typeof ProctoringEventType]

export const EventSeverity = {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL',
} as const
export type EventSeverityType = typeof EventSeverity[keyof typeof EventSeverity]

export const OwnerType = {
    CANDIDATE: 'CANDIDATE',
    USER: 'USER',
} as const
export type OwnerTypeValue = typeof OwnerType[keyof typeof OwnerType]

export const FileType = {
    RESUME: 'RESUME',
    VIDEO: 'VIDEO',
    AI_RECORDING: 'AI_RECORDING',
} as const
export type FileTypeValue = typeof FileType[keyof typeof FileType]

// Job Board Enums
export const JobStatus = {
    DRAFT: 'DRAFT',
    PUBLISHED: 'PUBLISHED',
    CLOSED: 'CLOSED',
} as const
export type JobStatusType = typeof JobStatus[keyof typeof JobStatus]

export const EmploymentType = {
    FULL_TIME: 'FULL_TIME',
    PART_TIME: 'PART_TIME',
    CONTRACT: 'CONTRACT',
    INTERN: 'INTERN',
    OTHER: 'OTHER',
} as const
export type EmploymentTypeValue = typeof EmploymentType[keyof typeof EmploymentType]

export const ApplicationStatus = {
    APPLIED: 'APPLIED',
    SCREENING: 'SCREENING',
    INTERVIEW: 'INTERVIEW',
    OFFER: 'OFFER',
    HIRED: 'HIRED',
    REJECTED: 'REJECTED',
} as const
export type ApplicationStatusType = typeof ApplicationStatus[keyof typeof ApplicationStatus]

// AI Interview Agent Types
export const AgentType = {
    FRONTEND_ENGINEER: 'FRONTEND_ENGINEER',
    BACKEND_ENGINEER: 'BACKEND_ENGINEER',
    HR_GENERAL: 'HR_GENERAL',
} as const
export type AgentTypeValue = typeof AgentType[keyof typeof AgentType]

// AI Interview Session Status
export const AISessionStatus = {
    NOT_STARTED: 'NOT_STARTED',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    TIMEOUT: 'TIMEOUT',
    CANDIDATE_EXIT: 'CANDIDATE_EXIT',
    FAILED: 'FAILED',
} as const
export type AISessionStatusType = typeof AISessionStatus[keyof typeof AISessionStatus]

// AI Interview Response Status
export const AIResponseStatus = {
    PENDING_UPLOAD: 'PENDING_UPLOAD',
    UPLOADED: 'UPLOADED',
    PROCESSING: 'PROCESSING',
    PROCESSED: 'PROCESSED',
    FAILED: 'FAILED',
} as const
export type AIResponseStatusType = typeof AIResponseStatus[keyof typeof AIResponseStatus]

// AI Interview Synthesis Status
export const AISynthesisStatus = {
    PENDING: 'PENDING',
    PROCESSING: 'PROCESSING',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
} as const
export type AISynthesisStatusType = typeof AISynthesisStatus[keyof typeof AISynthesisStatus]

// ============================================
// USER MODEL
// ============================================
export interface IUser extends Document {
    _id: Types.ObjectId
    email: string
    passwordHash?: string
    firstName: string
    lastName: string
    authProvider?: string
    authProviderId?: string
    onboardingCompleted: boolean
    createdAt: Date
    updatedAt: Date
}

const UserSchema = new Schema<IUser>({
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    authProvider: { type: String },
    authProviderId: { type: String },
    onboardingCompleted: { type: Boolean, default: false },
}, { timestamps: true })

export const User = mongoose.model<IUser>('User', UserSchema)

// ============================================
// ORGANIZATION MODEL
// ============================================
export interface IOrganization extends Document {
    _id: Types.ObjectId
    name: string
    slug: string
    logoUrl?: string
    website?: string
    plan: PlanType
    createdAt: Date
    updatedAt: Date
}

const OrganizationSchema = new Schema<IOrganization>({
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    logoUrl: { type: String },
    website: { type: String },
    plan: { type: String, enum: Object.values(Plan), default: Plan.FREE },
}, { timestamps: true })

export const Organization = mongoose.model<IOrganization>('Organization', OrganizationSchema)

// ============================================
// JOB MODEL
// ============================================
export interface IJob extends Document {
    _id: Types.ObjectId
    organizationId: Types.ObjectId
    title: string
    description: string
    department?: string
    location?: string
    employmentType: EmploymentTypeValue
    status: JobStatusType
    requirements?: string[]
    requiredSkills?: string[]
    salaryRange?: { min: number; max: number; currency: string }
    applicationSchema?: Record<string, unknown>
    publicSlug?: string
    createdBy?: Types.ObjectId
    publishedAt?: Date
    closedAt?: Date
    createdAt: Date
    updatedAt: Date
}

const JobSchema = new Schema<IJob>({
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    department: { type: String },
    location: { type: String },
    employmentType: { type: String, enum: Object.values(EmploymentType), default: EmploymentType.FULL_TIME },
    status: { type: String, enum: Object.values(JobStatus), default: JobStatus.DRAFT, index: true },
    requirements: [{ type: String }],
    requiredSkills: [{ type: String }],
    salaryRange: {
        min: { type: Number },
        max: { type: Number },
        currency: { type: String, default: 'USD' }
    },
    applicationSchema: { type: Schema.Types.Mixed },
    publicSlug: { type: String, unique: true, sparse: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    publishedAt: { type: Date },
    closedAt: { type: Date },
}, { timestamps: true })

export const Job = mongoose.model<IJob>('Job', JobSchema)

// ============================================
// ORGANIZATION MEMBER MODEL
// ============================================
export interface IOrganizationMember extends Document {
    _id: Types.ObjectId
    userId: Types.ObjectId
    organizationId: Types.ObjectId
    role: MemberRoleType
    joinedAt: Date
}

const OrganizationMemberSchema = new Schema<IOrganizationMember>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    role: { type: String, enum: Object.values(MemberRole), default: MemberRole.RECRUITER },
    joinedAt: { type: Date, default: Date.now },
})

OrganizationMemberSchema.index({ userId: 1, organizationId: 1 }, { unique: true })
OrganizationMemberSchema.index({ organizationId: 1 })
OrganizationMemberSchema.index({ userId: 1 })

export const OrganizationMember = mongoose.model<IOrganizationMember>('OrganizationMember', OrganizationMemberSchema)

// ============================================
// CANDIDATE MODEL
// ============================================
export interface ICandidate extends Document {
    _id: Types.ObjectId
    organizationId: Types.ObjectId
    email: string
    firstName?: string
    lastName?: string
    phone?: string
    source?: string
    jobId?: Types.ObjectId
    resumeUrl?: string
    applicationData?: Record<string, unknown>
    candidateStatus?: ApplicationStatusType
    createdAt: Date
    updatedAt: Date
}

const CandidateSchema = new Schema<ICandidate>({
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    email: { type: String, required: true, index: true },
    firstName: { type: String },
    lastName: { type: String },
    phone: { type: String },
    source: { type: String },
    jobId: { type: Schema.Types.ObjectId, ref: 'Job' },
    resumeUrl: { type: String },
    applicationData: { type: Schema.Types.Mixed },
    candidateStatus: { type: String, enum: Object.values(ApplicationStatus) },
}, { timestamps: true })

// Compound index for unique email per organization
CandidateSchema.index({ organizationId: 1, email: 1 }, { unique: true })

export const Candidate = mongoose.model<ICandidate>('Candidate', CandidateSchema)

// ============================================
// JOB APPLICATION MODEL
// ============================================
export interface IJobApplication extends Document {
    _id: Types.ObjectId
    organizationId: Types.ObjectId
    jobId: Types.ObjectId
    candidateId: Types.ObjectId
    applicationData?: Record<string, unknown>
    resumeUrl?: string
    status: ApplicationStatusType
    submittedAt: Date
    createdAt: Date
    updatedAt: Date
}

const JobApplicationSchema = new Schema<IJobApplication>({
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
    candidateId: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true },
    applicationData: { type: Schema.Types.Mixed },
    resumeUrl: { type: String },
    status: { type: String, enum: Object.values(ApplicationStatus), default: ApplicationStatus.APPLIED },
    submittedAt: { type: Date, default: Date.now },
}, { timestamps: true })

JobApplicationSchema.index({ jobId: 1, candidateId: 1 }, { unique: true })

export const JobApplication = mongoose.model<IJobApplication>('JobApplication', JobApplicationSchema)

// ============================================
// AUDIT LOG MODEL
// ============================================
export interface IAuditLog extends Document {
    _id: Types.ObjectId
    organizationId: Types.ObjectId
    entityType: string
    entityId: Types.ObjectId
    action: string
    previousValue?: Record<string, unknown>
    newValue?: Record<string, unknown>
    performedBy?: Types.ObjectId
    timestamp: Date
}

const AuditLogSchema = new Schema<IAuditLog>({
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    entityType: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId, required: true },
    action: { type: String, required: true },
    previousValue: { type: Schema.Types.Mixed },
    newValue: { type: Schema.Types.Mixed },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now },
})

AuditLogSchema.index({ entityType: 1, entityId: 1 })

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema)

// ============================================
// STAGE HISTORY MODEL
// ============================================
export interface IStageHistory extends Document {
    _id: Types.ObjectId
    applicationId: Types.ObjectId
    organizationId: Types.ObjectId
    fromStage: ApplicationStatusType | null
    toStage: ApplicationStatusType
    changedBy: Types.ObjectId
    changedAt: Date
}

const StageHistorySchema = new Schema<IStageHistory>({
    applicationId: { type: Schema.Types.ObjectId, ref: 'JobApplication', required: true, index: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    fromStage: { type: String, enum: [...Object.values(ApplicationStatus), null], default: null },
    toStage: { type: String, enum: Object.values(ApplicationStatus), required: true },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    changedAt: { type: Date, default: Date.now },
}, { timestamps: false })

StageHistorySchema.index({ applicationId: 1, changedAt: -1 })

export const StageHistory = mongoose.model<IStageHistory>('StageHistory', StageHistorySchema)

// ============================================
// CANDIDATE NOTE MODEL
// ============================================
export interface ICandidateNote extends Document {
    _id: Types.ObjectId
    candidateId: Types.ObjectId
    organizationId: Types.ObjectId
    authorId: Types.ObjectId
    content: string
    createdAt: Date
}

const CandidateNoteSchema = new Schema<ICandidateNote>({
    candidateId: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true, index: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
}, { timestamps: { createdAt: true, updatedAt: false } })

CandidateNoteSchema.index({ candidateId: 1, createdAt: -1 })

export const CandidateNote = mongoose.model<ICandidateNote>('CandidateNote', CandidateNoteSchema)

// ============================================
// ANALYTICS SNAPSHOT MODEL
// ============================================
export interface IAnalyticsSnapshot extends Document {
    organizationId: Types.ObjectId
    date: Date // simplified to YYYY-MM-DD
    totalReach: number
    engagedCandidates: number
    roi: number
    trends: Record<string, any> // Flexible JSON
    createdAt: Date
}

const AnalyticsSnapshotSchema = new Schema<IAnalyticsSnapshot>({
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    date: { type: Date, required: true },
    totalReach: { type: Number, default: 0 },
    engagedCandidates: { type: Number, default: 0 },
    roi: { type: Number, default: 0 },
    trends: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: { createdAt: true, updatedAt: false } })

AnalyticsSnapshotSchema.index({ organizationId: 1, date: -1 })

export const AnalyticsSnapshot = mongoose.model<IAnalyticsSnapshot>('AnalyticsSnapshot', AnalyticsSnapshotSchema)

// ============================================
// ASSESSMENT MODEL (with embedded rounds) -> No changes needed relative to context, but re-exporting below
// ============================================
export interface IAssessmentRound {
    _id?: Types.ObjectId
    roundType: RoundTypeValue
    enabled: boolean
    order: number
    config?: Record<string, unknown>
}

export interface IAssessment extends Document {
    _id: Types.ObjectId
    organizationId: Types.ObjectId
    jobId?: string
    title: string
    status: AssessmentStatusType
    rounds: IAssessmentRound[]
    createdAt: Date
    updatedAt: Date
}

const AssessmentRoundSchema = new Schema<IAssessmentRound>({
    roundType: { type: String, enum: Object.values(RoundType), required: true },
    enabled: { type: Boolean, default: false },
    order: { type: Number, required: true },
    config: { type: Schema.Types.Mixed },
}, { _id: true })

const AssessmentSchema = new Schema<IAssessment>({
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    jobId: { type: String },
    title: { type: String, required: true },
    status: { type: String, enum: Object.values(AssessmentStatus), default: AssessmentStatus.DRAFT, index: true },
    rounds: [AssessmentRoundSchema],
}, { timestamps: true })

export const Assessment = mongoose.model<IAssessment>('Assessment', AssessmentSchema)

// ============================================
// QUESTION MODEL (with embedded MCQ/DSA details)
// ============================================
export interface IMCQDetails {
    options: string[]
    correctOptions: number[]
    isMultiCorrect: boolean
}

export interface IDSATestCase {
    stdin: string
    expectedStdout: string
}

export interface IDSADetails {
    prompt: string
    constraints?: string
    starterCode: Record<string, string>
    languagesSupported: string[]
    /** Test cases for Judge0 evaluation (hidden from candidate). */
    testCases?: IDSATestCase[]
}

export interface IQuestion extends Document {
    _id: Types.ObjectId
    /** Optional stable id for lookup (e.g. seed IDs matching frontend mock bank) */
    slug?: string
    type: QuestionTypeValue
    title: string
    difficulty: DifficultyType
    topics: string[]
    metadata?: Record<string, unknown>
    mcqDetails?: IMCQDetails
    dsaDetails?: IDSADetails
    createdAt: Date
}

const QuestionSchema = new Schema<IQuestion>({
    slug: { type: String, sparse: true, unique: true },
    type: { type: String, enum: Object.values(QuestionType), required: true, index: true },
    title: { type: String, required: true },
    difficulty: { type: String, enum: Object.values(Difficulty), required: true, index: true },
    topics: [{ type: String }],
    metadata: { type: Schema.Types.Mixed },
    mcqDetails: {
        options: [{ type: String }],
        correctOptions: [{ type: Number }],
        isMultiCorrect: { type: Boolean, default: false },
    },
    dsaDetails: {
        prompt: { type: String },
        constraints: { type: String },
        starterCode: { type: Schema.Types.Mixed },
        languagesSupported: [{ type: String }],
        testCases: [{
            stdin: { type: String },
            expectedStdout: { type: String },
        }],
    },
}, { timestamps: { createdAt: true, updatedAt: false } })

export const Question = mongoose.model<IQuestion>('Question', QuestionSchema)

// ============================================
// ASSESSMENT ATTEMPT MODEL (with embedded round attempts)
// ============================================

// Per-question attempt tracking
export interface IQuestionAttempt {
    questionId: string
    questionIndex: number
    startedAt?: Date
    endedAt?: Date
    answer?: unknown
    status: QuestionStatusType
}

// AI Interview Transcript Entry
export interface IAITranscriptEntry {
    speaker: 'AI' | 'CANDIDATE'
    text: string
    timestamp: number // milliseconds from session start
}

export interface IRoundAttempt {
    _id?: Types.ObjectId
    roundType: RoundTypeValue
    status: RoundStatusType
    startedAt?: Date
    endedAt?: Date
    answers?: Record<string, unknown>
    questions?: any[] // Snapshot of questions
    timingMode: 'PER_QUESTION' | 'PER_ROUND' // NEW: determines which timer is active
    timeLimit?: number // Snapshot of time limit (minutes) - only for PER_ROUND
    // Per-question tracking (V1)
    currentQuestionIndex: number
    perQuestionTimeLimit: number // seconds - only for PER_QUESTION
    questionAttempts: IQuestionAttempt[]
    // AI Interview fields (V1)
    aiSessionId?: string
    aiSessionStatus?: AISessionStatusType
    agentType?: AgentTypeValue
    transcript?: IAITranscriptEntry[]
    aiMediaAssets?: {
        audioAssetId?: string
        videoAssetId?: string
    }
    aiDurationSeconds?: number
    // AI Interview V2 fields
    aiConsentRecordedAt?: Date
    aiQuestions?: { id: string; text: string; prepSeconds: number; answerSeconds: number }[]
    aiRestartUsed?: boolean
}

export interface IAssessmentAttempt extends Document {
    _id: Types.ObjectId
    assessmentId: Types.ObjectId
    candidateId: Types.ObjectId
    status: AttemptStatusType
    startedAt?: Date
    submittedAt?: Date
    rounds: IRoundAttempt[]
    createdAt: Date
    updatedAt: Date
}

const QuestionAttemptSchema = new Schema<IQuestionAttempt>({
    questionId: { type: String, required: true },
    questionIndex: { type: Number, required: true },
    startedAt: { type: Date },
    endedAt: { type: Date },
    answer: { type: Schema.Types.Mixed },
    status: { type: String, enum: Object.values(QuestionStatus), default: QuestionStatus.NOT_STARTED },
}, { _id: false })

const RoundAttemptSchema = new Schema<IRoundAttempt>({
    roundType: { type: String, enum: Object.values(RoundType), required: true },
    status: { type: String, enum: Object.values(RoundStatus), default: RoundStatus.NOT_STARTED },
    startedAt: { type: Date },
    endedAt: { type: Date },
    answers: { type: Schema.Types.Mixed },
    questions: { type: Schema.Types.Mixed }, // Snapshot of questions
    timingMode: { type: String, enum: ['PER_QUESTION', 'PER_ROUND'], default: 'PER_QUESTION' }, // NEW
    timeLimit: { type: Number, default: 0 }, // Snapshot of time limit (minutes) - only for PER_ROUND
    // Per-question tracking (V1)
    currentQuestionIndex: { type: Number, default: 0 },
    perQuestionTimeLimit: { type: Number, default: 0 }, // seconds - only for PER_QUESTION
    questionAttempts: [QuestionAttemptSchema],
    // AI Interview fields (V1)
    aiSessionId: { type: String },
    aiSessionStatus: { type: String, enum: Object.values(AISessionStatus) },
    agentType: { type: String, enum: Object.values(AgentType) },
    transcript: [{
        speaker: { type: String, enum: ['AI', 'CANDIDATE'], required: true },
        text: { type: String, required: true },
        timestamp: { type: Number, required: true },
    }],
    aiMediaAssets: {
        audioAssetId: { type: String },
        videoAssetId: { type: String },
    },
    aiDurationSeconds: { type: Number },
    // AI Interview V2 fields
    aiConsentRecordedAt: { type: Date },
    aiQuestions: [{
        id: { type: String, required: true },
        text: { type: String, required: true },
        prepSeconds: { type: Number, default: 30 },
        answerSeconds: { type: Number, default: 180 },
    }],
    aiRestartUsed: { type: Boolean, default: false },
}, { _id: true })

const AssessmentAttemptSchema = new Schema<IAssessmentAttempt>({
    assessmentId: { type: Schema.Types.ObjectId, ref: 'Assessment', required: true, index: true },
    candidateId: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true, index: true },
    status: { type: String, enum: Object.values(AttemptStatus), default: AttemptStatus.NOT_STARTED, index: true },
    startedAt: { type: Date },
    submittedAt: { type: Date },
    rounds: [RoundAttemptSchema],
}, { timestamps: true })

AssessmentAttemptSchema.index({ assessmentId: 1, candidateId: 1 }, { unique: true })

export const AssessmentAttempt = mongoose.model<IAssessmentAttempt>('AssessmentAttempt', AssessmentAttemptSchema)

// ============================================
// PROCTORING EVENT MODEL
// ============================================
export interface IProctoringEvent extends Document {
    _id: Types.ObjectId
    attemptId: Types.ObjectId
    roundType?: RoundTypeValue
    eventType: ProctoringEventTypeValue
    severity: EventSeverityType
    createdAt: Date
}

const ProctoringEventSchema = new Schema<IProctoringEvent>({
    attemptId: { type: Schema.Types.ObjectId, ref: 'AssessmentAttempt', required: true, index: true },
    roundType: { type: String, enum: Object.values(RoundType) },
    eventType: { type: String, enum: Object.values(ProctoringEventType), required: true, index: true },
    severity: { type: String, enum: Object.values(EventSeverity), default: EventSeverity.LOW },
}, { timestamps: { createdAt: true, updatedAt: false } })

export const ProctoringEvent = mongoose.model<IProctoringEvent>('ProctoringEvent', ProctoringEventSchema)

// ============================================
// EVALUATION MODEL
// ============================================
export interface IEvaluation extends Document {
    _id: Types.ObjectId
    attemptId: Types.ObjectId
    roundType: RoundTypeValue
    score: number
    maxScore: number
    metadata?: Record<string, unknown>
    evaluatedAt: Date
}

const EvaluationSchema = new Schema<IEvaluation>({
    attemptId: { type: Schema.Types.ObjectId, ref: 'AssessmentAttempt', required: true, index: true },
    roundType: { type: String, enum: Object.values(RoundType), required: true },
    score: { type: Number, required: true },
    maxScore: { type: Number, required: true },
    metadata: { type: Schema.Types.Mixed },
    evaluatedAt: { type: Date, default: Date.now },
})

EvaluationSchema.index({ attemptId: 1, roundType: 1 }, { unique: true })

export const Evaluation = mongoose.model<IEvaluation>('Evaluation', EvaluationSchema)

// ============================================
// FILE ASSET MODEL
// ============================================
export interface IFileAsset extends Document {
    _id: Types.ObjectId
    organizationId?: Types.ObjectId
    ownerType: OwnerTypeValue
    ownerId: string
    fileType: FileTypeValue
    storageKey: string
    mimeType: string
    size: number
    createdAt: Date
}

const FileAssetSchema = new Schema<IFileAsset>({
    organizationId: { type: Schema.Types.ObjectId },
    ownerType: { type: String, enum: Object.values(OwnerType), required: true },
    ownerId: { type: String, required: true },
    fileType: { type: String, enum: Object.values(FileType), required: true },
    storageKey: { type: String, required: true, unique: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
}, { timestamps: { createdAt: true, updatedAt: false } })

FileAssetSchema.index({ ownerType: 1, ownerId: 1 })
FileAssetSchema.index({ organizationId: 1 })

export const FileAsset = mongoose.model<IFileAsset>('FileAsset', FileAssetSchema)

// ============================================
// AI INTERVIEW RESPONSE MODEL (one per question per session)
// ============================================
export interface IAITranscriptSegment {
    start: number
    end: number
    text: string
}

export interface IAIResponseAnalysis {
    version: string
    summary: string[]
    keyPoints: string[]
    skillsObserved: string[]
    relevance: 'low' | 'medium' | 'high'
}

export interface IAIInterviewResponse extends Document {
    _id: Types.ObjectId
    attemptId: Types.ObjectId
    sessionId: string
    questionId: string
    questionIndex: number
    questionText: string
    storageKey: string
    durationSeconds: number
    status: AIResponseStatusType
    transcript?: string
    transcriptSegments?: IAITranscriptSegment[]
    analysis?: IAIResponseAnalysis
    processingStartedAt?: Date
    processingCompletedAt?: Date
    processingError?: string
    createdAt: Date
}

const AIInterviewResponseSchema = new Schema<IAIInterviewResponse>({
    attemptId: { type: Schema.Types.ObjectId, ref: 'AssessmentAttempt', required: true, index: true },
    sessionId: { type: String, required: true, index: true },
    questionId: { type: String, required: true },
    questionIndex: { type: Number, required: true },
    questionText: { type: String, required: true },
    storageKey: { type: String, default: '' },
    durationSeconds: { type: Number, default: 0 },
    status: { type: String, enum: Object.values(AIResponseStatus), default: AIResponseStatus.PENDING_UPLOAD },
    transcript: { type: String },
    transcriptSegments: [{
        start: { type: Number, required: true },
        end: { type: Number, required: true },
        text: { type: String, required: true },
    }],
    analysis: {
        version: { type: String },
        summary: [{ type: String }],
        keyPoints: [{ type: String }],
        skillsObserved: [{ type: String }],
        relevance: { type: String, enum: ['low', 'medium', 'high'] },
    },
    processingStartedAt: { type: Date },
    processingCompletedAt: { type: Date },
    processingError: { type: String },
}, { timestamps: { createdAt: true, updatedAt: false } })

AIInterviewResponseSchema.index({ attemptId: 1, sessionId: 1 })
AIInterviewResponseSchema.index({ sessionId: 1, questionId: 1 }, { unique: true })

export const AIInterviewResponse = mongoose.model<IAIInterviewResponse>('AIInterviewResponse', AIInterviewResponseSchema)

// ============================================
// AI INTERVIEW SYNTHESIS MODEL (one per session)
// ============================================
export interface IAIInterviewSynthesis extends Document {
    _id: Types.ObjectId
    attemptId: Types.ObjectId
    sessionId: string
    version: string
    overallSummary: string
    strengths: string[]
    gaps: string[]
    suggestedFollowUps: string[]
    totalQuestions: number
    processedQuestions: number
    status: AISynthesisStatusType
    createdAt: Date
}

const AIInterviewSynthesisSchema = new Schema<IAIInterviewSynthesis>({
    attemptId: { type: Schema.Types.ObjectId, ref: 'AssessmentAttempt', required: true, index: true },
    sessionId: { type: String, required: true, unique: true },
    version: { type: String, default: '1.0' },
    overallSummary: { type: String, default: '' },
    strengths: [{ type: String }],
    gaps: [{ type: String }],
    suggestedFollowUps: [{ type: String }],
    totalQuestions: { type: Number, default: 0 },
    processedQuestions: { type: Number, default: 0 },
    status: { type: String, enum: Object.values(AISynthesisStatus), default: AISynthesisStatus.PENDING },
}, { timestamps: { createdAt: true, updatedAt: false } })

export const AIInterviewSynthesis = mongoose.model<IAIInterviewSynthesis>('AIInterviewSynthesis', AIInterviewSynthesisSchema)
