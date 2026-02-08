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
} as const
export type RoundStatusType = typeof RoundStatus[keyof typeof RoundStatus]

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
} as const
export type FileTypeValue = typeof FileType[keyof typeof FileType]

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
    department: string
    location: string
    type: 'FULL_TIME' | 'CONTRACT' | 'INTERNSHIP' | 'PART_TIME'
    status: 'LIVE' | 'CLOSED' | 'DRAFT' | 'PAUSED'
    requirements?: string[]
    salaryRange?: { min: number; max: number; currency: string }
    createdAt: Date
    updatedAt: Date
}

const JobSchema = new Schema<IJob>({
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    department: { type: String, required: true },
    location: { type: String, required: true },
    type: { type: String, default: 'FULL_TIME' }, // relaxed enum for now or keep strict
    status: { type: String, enum: ['LIVE', 'CLOSED', 'DRAFT', 'PAUSED'], default: 'LIVE', index: true },
    requirements: [{ type: String }],
    salaryRange: {
        min: { type: Number },
        max: { type: Number },
        currency: { type: String, default: 'USD' }
    }
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
    createdAt: Date
    updatedAt: Date
}

const CandidateSchema = new Schema<ICandidate>({
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    email: { type: String, required: true, index: true }, // Scoped uniqueness logic might be needed manually if organizationId + email is unique
    firstName: { type: String },
    lastName: { type: String },
    phone: { type: String },
    source: { type: String },
}, { timestamps: true })

// Compound index for unique email per organization
CandidateSchema.index({ organizationId: 1, email: 1 }, { unique: true })

export const Candidate = mongoose.model<ICandidate>('Candidate', CandidateSchema)

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
export interface IRoundAttempt {
    _id?: Types.ObjectId
    roundType: RoundTypeValue
    status: RoundStatusType
    startedAt?: Date
    endedAt?: Date
    answers?: Record<string, unknown>
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

const RoundAttemptSchema = new Schema<IRoundAttempt>({
    roundType: { type: String, enum: Object.values(RoundType), required: true },
    status: { type: String, enum: Object.values(RoundStatus), default: RoundStatus.NOT_STARTED },
    startedAt: { type: Date },
    endedAt: { type: Date },
    answers: { type: Schema.Types.Mixed },
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
