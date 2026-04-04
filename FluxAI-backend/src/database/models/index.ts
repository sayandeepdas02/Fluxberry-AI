import mongoose, { Schema, Document, Types } from 'mongoose'
import type { IScoringConfig } from '../../modules/ats-screening/scoring-config.types.js'

// Enums
export const MemberRole = {
    OWNER: 'OWNER',
    ADMIN: 'ADMIN',
    HIRING_MANAGER: 'HIRING_MANAGER',
    RECRUITER: 'RECRUITER',
    INTERVIEWER: 'INTERVIEWER',
} as const
export type MemberRoleType = typeof MemberRole[keyof typeof MemberRole]

export const Plan = {
    FREE: 'free',
    GROWTH: 'growth',
    SCALE: 'scale',
    ENTERPRISE: 'enterprise',
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

// Pipeline Stage Type
export const PipelineStageType = {
    APPLIED: 'APPLIED',
    SCREENING: 'SCREENING',
    INTERVIEW: 'INTERVIEW',
    OFFER: 'OFFER',
    HIRED: 'HIRED',
    REJECTED: 'REJECTED',
    CUSTOM: 'CUSTOM',
} as const
export type PipelineStageTypeValue = typeof PipelineStageType[keyof typeof PipelineStageType]

// RBAC Resource/Action enums
export const RBACResource = {
    JOBS: 'JOBS',
    APPLICATIONS: 'APPLICATIONS',
    CANDIDATES: 'CANDIDATES',
    PIPELINE: 'PIPELINE',
    OFFERS: 'OFFERS',
    ONBOARDING: 'ONBOARDING',
    ANALYTICS: 'ANALYTICS',
    ASSESSMENTS: 'ASSESSMENTS',
    SETTINGS: 'SETTINGS',
    MEMBERS: 'MEMBERS',
} as const
export type RBACResourceType = typeof RBACResource[keyof typeof RBACResource]

export const RBACAction = {
    CREATE: 'CREATE',
    READ: 'READ',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
    MANAGE: 'MANAGE', // Full access
} as const
export type RBACActionType = typeof RBACAction[keyof typeof RBACAction]

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
    OFFER_SENT: 'OFFER_SENT',
    OFFER_ACCEPTED: 'OFFER_ACCEPTED',
    OFFER_DECLINED: 'OFFER_DECLINED',
    ONBOARDING: 'ONBOARDING',
    HIRED: 'HIRED',
    REJECTED: 'REJECTED',
} as const
export type ApplicationStatusType = typeof ApplicationStatus[keyof typeof ApplicationStatus]

export const OfferStatus = {
    DRAFT: 'DRAFT',
    SENT: 'SENT',
    VIEWED: 'VIEWED',
    SIGNED: 'SIGNED',
    REJECTED: 'REJECTED',
    EXPIRED: 'EXPIRED',
} as const
export type OfferStatusType = typeof OfferStatus[keyof typeof OfferStatus]

export const OnboardingStatus = {
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
} as const
export type OnboardingStatusType = typeof OnboardingStatus[keyof typeof OnboardingStatus]

export const OnboardingDocumentStatus = {
    PENDING: 'PENDING',
    UPLOADED: 'UPLOADED',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
} as const
export type OnboardingDocumentStatusType = typeof OnboardingDocumentStatus[keyof typeof OnboardingDocumentStatus]

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
    googleAccessToken?: string
    googleRefreshToken?: string
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
    googleAccessToken: { type: String },
    googleRefreshToken: { type: String },
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
    trialActive: boolean
    trialEndsAt: Date | null
    installedApps: Record<string, { enabled: boolean; installed: boolean; limits?: Record<string, number> }>
    createdAt: Date
    updatedAt: Date
}


const OrganizationSchema = new Schema<IOrganization>({
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    logoUrl: { type: String },
    website: { type: String },
    plan: { type: String, enum: Object.values(Plan), default: Plan.FREE },
    trialActive: { type: Boolean, default: false },
    trialEndsAt: { type: Date, default: null },
    installedApps: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true })

// Auto-stamp 14-day trial for brand-new organizations
// Mongoose v9: PreSaveMiddlewareFunction takes (opts: SaveOptions) — no next() callback
OrganizationSchema.pre('save', async function () {
    if (this.isNew) {
        const trialEnd = new Date()
        trialEnd.setDate(trialEnd.getDate() + 14)
        ;(this as any).trialActive = true
        ;(this as any).trialEndsAt = trialEnd

        // Enable all core + add-on apps during trial
        ;(this as any).installedApps = {
            job_board: { enabled: true, installed: true },
            ats_screening: { enabled: true, installed: true, limits: { resumes: 1000 } },
            onboarding: { enabled: true, installed: true },
            interview_agent: { enabled: true, installed: true },
            talent_prospect: { enabled: true, installed: true, limits: { credits: 50 } },
            analytics: { enabled: true, installed: true },
        }
    }
})

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
    optionalSkills?: string[]
    experienceRange?: { min: number; max: number }
    scoringConfig?: IScoringConfig
    salaryRange?: { min: number; max: number; currency: string }
    applicationSchema?: Record<string, unknown>
    publicSlug?: string
    createdBy?: Types.ObjectId
    publishedAt?: Date
    closedAt?: Date
    deletedAt?: Date
    createdAt: Date
    updatedAt: Date
}

const JobSchema = new Schema<IJob>({
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    department: { type: String, index: true },
    location: { type: String },
    employmentType: { type: String, enum: Object.values(EmploymentType), default: EmploymentType.FULL_TIME },
    status: { type: String, enum: Object.values(JobStatus), default: JobStatus.DRAFT, index: true },
    requirements: [{ type: String }],
    requiredSkills: [{ type: String }],
    optionalSkills: [{ type: String }],
    experienceRange: {
        min: { type: Number },
        max: { type: Number },
    },
    scoringConfig: {
        version: { type: String, enum: ['v1', 'v2'], default: 'v2' },
        weights: {
            skills:      { type: Number, default: 0.35 },
            experience:  { type: Number, default: 0.30 },
            projects:    { type: Number, default: 0.20 },
            education:   { type: Number, default: 0.10 },
            signalBoost: { type: Number, default: 0.05 },
        },
        thresholds: {
            shortlist:  { type: Number, default: 80 },
            review:     { type: Number, default: 60 },
            autoReject: { type: Number, default: 0 },
        },
        hardGates: {
            requiredSkills:         [{ type: String }],
            minimumExperienceYears: { type: Number, default: 0 },
            requiredEducationLevel: { type: String },
        },
    },
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
    deletedAt: { type: Date, default: null },
}, { timestamps: true })

// Compound indexes for common query patterns
JobSchema.index({ organizationId: 1, status: 1, deletedAt: 1 })
JobSchema.index({ organizationId: 1, department: 1 })
// Public listing indexes
JobSchema.index({ status: 1, createdAt: -1 })          // sorted listing
JobSchema.index({ status: 1, title: 'text', department: 'text' }) // search

export const Job = mongoose.model<IJob>('Job', JobSchema)

// ============================================
// PIPELINE STAGE MODEL (Custom stages per job)
// ============================================
export interface IPipelineStage extends Document {
    _id: Types.ObjectId
    jobId: Types.ObjectId
    organizationId: Types.ObjectId
    name: string
    type: PipelineStageTypeValue
    order: number
    color?: string
    isDefault: boolean
    createdAt: Date
    updatedAt: Date
}

const PipelineStageSchema = new Schema<IPipelineStage>({
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true },
    type: { type: String, enum: Object.values(PipelineStageType), required: true },
    order: { type: Number, required: true },
    color: { type: String },
    isDefault: { type: Boolean, default: false },
}, { timestamps: true })

PipelineStageSchema.index({ jobId: 1, order: 1 })
PipelineStageSchema.index({ jobId: 1, type: 1 })

export const PipelineStage = mongoose.model<IPipelineStage>('PipelineStage', PipelineStageSchema)

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
    resumeUrl?: string
    parsedResumeData?: Record<string, unknown>
    tags?: string[]
    isDeleted: boolean
    deletedAt?: Date
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
    resumeUrl: { type: String },
    parsedResumeData: { type: Schema.Types.Mixed },
    tags: [{ type: String }],
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
}, { timestamps: true })

// Compound index for unique email per organization
CandidateSchema.index({ organizationId: 1, email: 1 }, { unique: true })
CandidateSchema.index({ organizationId: 1, deletedAt: 1 })
CandidateSchema.index({ tags: 1 })
CandidateSchema.index({ firstName: 'text', lastName: 'text', email: 'text', tags: 'text' })

export const Candidate = mongoose.model<ICandidate>('Candidate', CandidateSchema)

// ============================================
// JOB APPLICATION MODEL
// ============================================
export interface IJobApplication extends Document {
    _id: Types.ObjectId
    organizationId: Types.ObjectId
    jobId: Types.ObjectId
    candidateId: Types.ObjectId
    currentStageId?: Types.ObjectId
    applicationData?: Record<string, unknown>
    resumeUrl?: string
    status: ApplicationStatusType
    score?: number
    assignedTo?: Types.ObjectId
    rejectionReason?: string
    lastActivityAt?: Date
    isDeleted: boolean
    submittedAt: Date
    deletedAt?: Date
    createdAt: Date
    updatedAt: Date
}

const JobApplicationSchema = new Schema<IJobApplication>({
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
    candidateId: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true, index: true },
    currentStageId: { type: Schema.Types.ObjectId, ref: 'PipelineStage' },
    applicationData: { type: Schema.Types.Mixed },
    resumeUrl: { type: String },
    status: { type: String, enum: Object.values(ApplicationStatus), default: ApplicationStatus.APPLIED },
    score: { type: Number },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: { type: String },
    lastActivityAt: { type: Date, default: Date.now },
    isDeleted: { type: Boolean, default: false },
    submittedAt: { type: Date, default: Date.now },
    deletedAt: { type: Date, default: null },
}, { timestamps: true })

JobApplicationSchema.index({ jobId: 1, candidateId: 1 }, { unique: true })
JobApplicationSchema.index({ jobId: 1, status: 1 })
JobApplicationSchema.index({ organizationId: 1, status: 1, deletedAt: 1 })
JobApplicationSchema.index({ candidateId: 1, organizationId: 1 })
JobApplicationSchema.index({ currentStageId: 1 })

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
// ROLE PERMISSION MODEL (DB-driven RBAC)
// ============================================
export interface IRolePermission extends Document {
    _id: Types.ObjectId
    role: MemberRoleType
    resource: RBACResourceType
    action: RBACActionType
    allowed: boolean
    createdAt: Date
    updatedAt: Date
}

const RolePermissionSchema = new Schema<IRolePermission>({
    role: { type: String, enum: Object.values(MemberRole), required: true },
    resource: { type: String, enum: Object.values(RBACResource), required: true },
    action: { type: String, enum: Object.values(RBACAction), required: true },
    allowed: { type: Boolean, default: false },
}, { timestamps: true })

RolePermissionSchema.index({ role: 1, resource: 1, action: 1 }, { unique: true })

export const RolePermission = mongoose.model<IRolePermission>('RolePermission', RolePermissionSchema)

// ============================================
// EMAIL LOG MODEL
// ============================================
export interface IEmailLog extends Document {
    _id: Types.ObjectId
    organizationId?: Types.ObjectId
    to: string
    subject: string
    template?: string
    status: 'QUEUED' | 'SENT' | 'FAILED'
    sentAt?: Date
    error?: string
    metadata?: Record<string, unknown>
    createdAt: Date
}

const EmailLogSchema = new Schema<IEmailLog>({
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', index: true },
    to: { type: String, required: true },
    subject: { type: String, required: true },
    template: { type: String },
    status: { type: String, enum: ['QUEUED', 'SENT', 'FAILED'], default: 'QUEUED' },
    sentAt: { type: Date },
    error: { type: String },
    metadata: { type: Schema.Types.Mixed },
}, { timestamps: { createdAt: true, updatedAt: false } })

EmailLogSchema.index({ organizationId: 1, createdAt: -1 })
EmailLogSchema.index({ status: 1 })

export const EmailLog = mongoose.model<IEmailLog>('EmailLog', EmailLogSchema)

// ============================================
// STAGE HISTORY MODEL
// ============================================
export interface IStageHistory extends Document {
    _id: Types.ObjectId
    applicationId: Types.ObjectId
    organizationId: Types.ObjectId
    fromStage: ApplicationStatusType | null
    toStage: ApplicationStatusType
    fromStageId?: Types.ObjectId
    toStageId?: Types.ObjectId
    timeInStageMs?: number
    changedBy: Types.ObjectId
    changedAt: Date
}

const StageHistorySchema = new Schema<IStageHistory>({
    applicationId: { type: Schema.Types.ObjectId, ref: 'JobApplication', required: true, index: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    fromStage: { type: String, enum: [...Object.values(ApplicationStatus), null], default: null },
    toStage: { type: String, enum: Object.values(ApplicationStatus), required: true },
    fromStageId: { type: Schema.Types.ObjectId, ref: 'PipelineStage' },
    toStageId: { type: Schema.Types.ObjectId, ref: 'PipelineStage' },
    timeInStageMs: { type: Number },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    changedAt: { type: Date, default: Date.now },
}, { timestamps: false })

StageHistorySchema.index({ applicationId: 1, changedAt: -1 })
StageHistorySchema.index({ toStageId: 1 })

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

AssessmentSchema.index({ jobId: 1 })

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
    /** Organization that owns this question. null = global/seeded question visible to all orgs. */
    organizationId?: Types.ObjectId
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
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', index: true, default: null },
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

QuestionSchema.index({ organizationId: 1, type: 1, difficulty: 1 })

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
    // Ribbon (interactive voice AI)
    ribbonInterviewId?: string
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
    ribbonInterviewId: { type: String },
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
AssessmentAttemptSchema.index({ 'rounds.ribbonInterviewId': 1 }, { sparse: true })

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
    /** Full transcript (Ribbon); optional for legacy session-based flow */
    transcript?: string
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
    transcript: { type: String },
}, { timestamps: { createdAt: true, updatedAt: false } })

export const AIInterviewSynthesis = mongoose.model<IAIInterviewSynthesis>('AIInterviewSynthesis', AIInterviewSynthesisSchema)

// ============================================
// AI INTERVIEW ORCHESTRATOR — PHASE ENUM & SESSION MODEL
// ============================================

export const InterviewPhase = {
    INTRO: 'INTRO',
    PROJECT_DEEP_DIVE: 'PROJECT_DEEP_DIVE',
    FUNDAMENTALS: 'FUNDAMENTALS',
    CULTURE_FIT: 'CULTURE_FIT',
    SUMMARY: 'SUMMARY',
    COMPLETED: 'COMPLETED',
} as const
export type InterviewPhaseValue = typeof InterviewPhase[keyof typeof InterviewPhase]

export const OrchestratorSessionStatus = {
    ACTIVE: 'ACTIVE',
    COMPLETED: 'COMPLETED',
    ABANDONED: 'ABANDONED',
    TIMED_OUT: 'TIMED_OUT',
} as const
export type OrchestratorSessionStatusType = typeof OrchestratorSessionStatus[keyof typeof OrchestratorSessionStatus]

// Per-turn evaluation stored by the orchestrator
export interface IOrchestratorEvaluation {
    phase: InterviewPhaseValue
    question: string
    answer: string
    metrics: {
        correctnessScore: number    // 0–10
        depthScore: number          // 0–10
        communicationScore: number  // 0–10
        relevanceScore: number      // 0–10
        feedback?: string           // brief LLM-generated feedback note (not shown to candidate)
        redFlags?: string[]  // e.g. ["Contradicted earlier answer", "Could not explain own code"]
    }
}

// Snapshot of aiConfig stored on session creation
export interface IOrchestratorAIConfig {
    role: 'FRONTEND' | 'BACKEND' | 'FULLSTACK' | 'DEVOPS'
    difficulty: 'JUNIOR' | 'MID' | 'SENIOR'
    maxDurationMinutes: number
    maxFundamentalQuestions: number
    maxProjectFollowUps: number
    grillingIntensity: 'LOW' | 'MEDIUM' | 'HIGH'
}

export interface ICandidateContext {
    role?: string
    yearsOfExperience?: number
    projects?: string[]
    techStack?: string[]
}

export interface IAIInterviewSession extends Document {
    _id: Types.ObjectId
    attemptId: Types.ObjectId
    roundId?: Types.ObjectId
    candidateId: Types.ObjectId
    organizationId: Types.ObjectId

    status: OrchestratorSessionStatusType
    currentPhase: InterviewPhaseValue
    followUpCount: number           // follow-ups in current phase
    projectFollowUpCount: number    // total project deep-dive follow-ups
    questionIndex: number           // questions asked within current phase
    llmCallCount: number            // total LLM calls this session (budget guard)

    transcript: Array<{
        speaker: 'AI' | 'CANDIDATE'
        text: string
        timestamp: Date
    }>

    evaluations: IOrchestratorEvaluation[]
    aiConfig: IOrchestratorAIConfig
    candidateContext: ICandidateContext
    fundamentalsQueue?: string[]    // pre-selected blueprint questions for FUNDAMENTALS phase

    startedAt: Date
    endedAt?: Date
    overallScore?: number               // 0–100 weighted final score
    recommendation?: 'HIRE' | 'NO_HIRE' | 'FURTHER_REVIEW'
    scoreBreakdown?: Record<string, number>  // dimension → score

    createdAt: Date
    updatedAt: Date
}

const OrchestratorEvaluationSchema = new Schema<IOrchestratorEvaluation>({
    phase: { type: String, enum: Object.values(InterviewPhase), required: true },
    question: { type: String, required: true },
    answer: { type: String, required: true },
    metrics: {
        correctnessScore: { type: Number, required: true },
        depthScore: { type: Number, required: true },
        communicationScore: { type: Number, required: true },
        relevanceScore: { type: Number, required: true },
        feedback: { type: String },
        redFlags: [{ type: String }],  // per-answer flags from LLM evaluator
    },
}, { _id: false })

const AIInterviewSessionSchema = new Schema<IAIInterviewSession>({
    attemptId: { type: Schema.Types.ObjectId, ref: 'AssessmentAttempt', required: true, index: true },
    roundId: { type: Schema.Types.ObjectId },
    candidateId: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true, index: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },

    status: {
        type: String,
        enum: Object.values(OrchestratorSessionStatus),
        default: OrchestratorSessionStatus.ACTIVE,
    },
    currentPhase: {
        type: String,
        enum: Object.values(InterviewPhase),
        default: InterviewPhase.INTRO,
    },
    followUpCount: { type: Number, default: 0 },
    projectFollowUpCount: { type: Number, default: 0 },
    questionIndex: { type: Number, default: 0 },

    transcript: [{
        speaker: { type: String, enum: ['AI', 'CANDIDATE'], required: true },
        text: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
    }],

    evaluations: [OrchestratorEvaluationSchema],

    aiConfig: {
        role: { type: String, enum: ['FRONTEND', 'BACKEND', 'FULLSTACK', 'DEVOPS'], default: 'BACKEND' },
        difficulty: { type: String, enum: ['JUNIOR', 'MID', 'SENIOR'], default: 'MID' },
        maxDurationMinutes: { type: Number, default: 45 },
        maxFundamentalQuestions: { type: Number, default: 5 },
        maxProjectFollowUps: { type: Number, default: 2 },
        grillingIntensity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
    },

    candidateContext: {
        role: { type: String },
        yearsOfExperience: { type: Number },
        projects: [{ type: String }],
        techStack: [{ type: String }],
    },

    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date },
    overallScore: { type: Number },
    recommendation: { type: String, enum: ['HIRE', 'NO_HIRE', 'FURTHER_REVIEW'] },
    scoreBreakdown: { type: Schema.Types.Mixed },
    fundamentalsQueue: [{ type: String }],      // pre-selected blueprint question strings (FIFO)
    llmCallCount: { type: Number, default: 0 }, // budget tracker — max calls guard
}, { timestamps: true })

AIInterviewSessionSchema.index({ attemptId: 1, status: 1 })

export const AIInterviewSession = mongoose.model<IAIInterviewSession>('AIInterviewSession', AIInterviewSessionSchema)


// ============================================
// ORGANIZATION ONBOARDING CONFIG MODEL
// ============================================
export interface IOrganizationOnboardingConfig extends Document {
    _id: Types.ObjectId
    organizationId: Types.ObjectId
    requiredDocuments: string[] // List of document titles e.g. ["ID Proof", "Contract"]
    createdAt: Date
    updatedAt: Date
}

const OrganizationOnboardingConfigSchema = new Schema<IOrganizationOnboardingConfig>({
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, unique: true },
    requiredDocuments: [{ type: String }],
}, { timestamps: true })

export const OrganizationOnboardingConfig = mongoose.model<IOrganizationOnboardingConfig>('OrganizationOnboardingConfig', OrganizationOnboardingConfigSchema)

// ============================================
// OFFER TEMPLATE MODEL
// ============================================
export interface IOfferTemplate extends Document {
    _id: Types.ObjectId
    organizationId: Types.ObjectId
    name: string
    content: string // HTML or text content with placeholders
    variables: string[] // List of variables used in content (Legacy)
    variableSchema: Record<string, { type: string, label: string }> // JSON schema for variables
    isActive: boolean
    createdAt: Date
    updatedAt: Date
}



// ============================================
// OFFER MODEL
// ============================================
export interface IOffer extends Document {
    _id: Types.ObjectId
    organizationId: Types.ObjectId
    applicationId: Types.ObjectId
    candidateId: Types.ObjectId
    templateId?: Types.ObjectId
    templateSnapshot?: string // HTML snapshot at creation
    variables?: Record<string, any>
    status: OfferStatusType
    content: string // Rendered content (or base content)
    pdfUrl?: string // Unsigned PDF
    signedPdfUrl?: string // Signed PDF
    signature?: {
        name: string
        data: string // Base64 or SVG
        ip: string
        signedAt: Date
    }
    expiresAt?: Date
    token?: string // Secure token for public access
    openedAt?: Date
    acceptedAt?: Date
    declinedAt?: Date
    declineReason?: string
    createdAt: Date
    updatedAt: Date
}



// ============================================
// ONBOARDING MODEL
// ============================================
export interface IOnboarding extends Document {
    _id: Types.ObjectId
    organizationId: Types.ObjectId
    applicationId: Types.ObjectId
    candidateId: Types.ObjectId
    status: OnboardingStatusType
    formTemplateSnapshot?: Record<string, any>
    formTemplateVersion?: number
    startDate?: Date
    completedAt?: Date
    expiresAt?: Date
    reminderCount?: number
    lastReminderSentAt?: Date
    workflowState?: 'FORM_PENDING' | 'DOCUMENT_PENDING' | 'UNDER_REVIEW' | 'COMPLETED'
    createdAt: Date
    updatedAt: Date
}

const OnboardingSchema = new Schema<IOnboarding>({
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    applicationId: { type: Schema.Types.ObjectId, ref: 'JobApplication', required: true, unique: true },
    candidateId: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true },
    status: { type: String, enum: Object.values(OnboardingStatus), default: OnboardingStatus.IN_PROGRESS, index: true },
    formTemplateSnapshot: { type: Schema.Types.Mixed },
    formTemplateVersion: { type: Number },
    startDate: { type: Date },
    completedAt: { type: Date },
    expiresAt: { type: Date },
    reminderCount: { type: Number, default: 0 },
    lastReminderSentAt: { type: Date },
    workflowState: { type: String, enum: ['FORM_PENDING', 'DOCUMENT_PENDING', 'UNDER_REVIEW', 'COMPLETED'] },
}, { timestamps: true })

export const Onboarding = mongoose.model<IOnboarding>('Onboarding', OnboardingSchema)

// ============================================
// ONBOARDING DOCUMENT MODEL
// ============================================
export interface IOnboardingDocument extends Document {
    _id: Types.ObjectId
    organizationId: Types.ObjectId
    onboardingId: Types.ObjectId
    title: string
    fileAssetId?: Types.ObjectId
    status: OnboardingDocumentStatusType
    reviewedBy?: Types.ObjectId
    reviewedAt?: Date
    feedback?: string
    createdAt: Date
    updatedAt: Date
}

const OnboardingDocumentSchema = new Schema<IOnboardingDocument>({
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    onboardingId: { type: Schema.Types.ObjectId, ref: 'Onboarding', required: true, index: true },
    title: { type: String, required: true },
    fileAssetId: { type: Schema.Types.ObjectId, ref: 'FileAsset' },
    status: { type: String, enum: Object.values(OnboardingDocumentStatus), default: OnboardingDocumentStatus.PENDING },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    feedback: { type: String },
}, { timestamps: true })

export const OnboardingDocument = mongoose.model<IOnboardingDocument>('OnboardingDocument', OnboardingDocumentSchema)

// ============================================
// OFFER TEMPLATE MODEL
// ============================================
export interface IOfferTemplate extends Document {
    _id: Types.ObjectId
    organizationId: Types.ObjectId
    name: string
    type: 'FULL_TIME' | 'INTERN' | 'CONTRACTOR'
    country?: string
    htmlContent: string
    variables: string[] // List of variables used in content
    version: number
    isActive: boolean
    createdBy?: Types.ObjectId
    createdAt: Date
    updatedAt: Date
}

const OfferTemplateSchema = new Schema<IOfferTemplate>({
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['FULL_TIME', 'INTERN', 'CONTRACTOR'], default: 'FULL_TIME' },
    country: { type: String },
    htmlContent: { type: String, required: true },
    variables: [{ type: String }],
    version: { type: Number, default: 1 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

export const OfferTemplate = mongoose.model<IOfferTemplate>('OfferTemplate', OfferTemplateSchema)

// ============================================
// OFFER MODEL
// ============================================
export interface IOffer extends Document {
    _id: Types.ObjectId
    organizationId: Types.ObjectId
    applicationId: Types.ObjectId
    candidateId: Types.ObjectId
    templateId?: Types.ObjectId
    snapshotHtml?: string
    snapshotVariables?: Record<string, any>
    snapshotTemplateVersion?: number
    status: OfferStatusType
    filledVariables?: Record<string, any>
    generatedPdfUrl?: string // Unsigned PDF
    signedPdfUrl?: string // Signed PDF
    signedPdfHash?: string
    expiresAt?: Date
    viewedAt?: Date
    signedAt?: Date
    rejectedReason?: string
    publicToken?: string // Secure token for public access
    tokenExpiresAt?: Date
    tokenUsedAt?: Date
    auditLog?: {
        event: string
        timestamp: Date
        ipAddress: string
    }[]
    createdAt: Date
    updatedAt: Date
}

const OfferSchema = new Schema<IOffer>({
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    applicationId: { type: Schema.Types.ObjectId, ref: 'JobApplication', required: true },
    candidateId: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true },
    templateId: { type: Schema.Types.ObjectId, ref: 'OfferTemplate' },
    snapshotHtml: { type: String },
    snapshotVariables: { type: Schema.Types.Mixed },
    snapshotTemplateVersion: { type: Number },
    status: { type: String, enum: Object.values(OfferStatus), default: OfferStatus.DRAFT },
    filledVariables: { type: Map, of: Schema.Types.Mixed }, // Stores key-value pairs for template variables
    generatedPdfUrl: { type: String },
    signedPdfUrl: { type: String },
    signedPdfHash: { type: String },
    expiresAt: { type: Date },
    viewedAt: { type: Date },
    signedAt: { type: Date },
    rejectedReason: { type: String },
    publicToken: { type: String, index: true },
    tokenExpiresAt: { type: Date },
    tokenUsedAt: { type: Date },
    auditLog: [{
        event: { type: String },
        timestamp: { type: Date, default: Date.now },
        ipAddress: { type: String }
    }],
}, { timestamps: true })

export const Offer = mongoose.model<IOffer>('Offer', OfferSchema)

// ============================================
// OFFER SIGNATURE MODEL
// ============================================
export interface IOfferSignature extends Document {
    offerId: Types.ObjectId
    signatureType: 'DRAWN' | 'TYPED'
    signatureImageUrl?: string
    documentHash?: string
    signedAt: Date
    ipAddress?: string
    createdAt: Date
    updatedAt: Date
}

const OfferSignatureSchema = new Schema<IOfferSignature>({
    offerId: { type: Schema.Types.ObjectId, ref: 'Offer', required: true, unique: true },
    signatureType: { type: String, enum: ['DRAWN', 'TYPED'], required: true },
    signatureImageUrl: { type: String },
    documentHash: { type: String },
    signedAt: { type: Date, default: Date.now },
    ipAddress: { type: String },
}, { timestamps: true })

export const OfferSignature = mongoose.model<IOfferSignature>('OfferSignature', OfferSignatureSchema)

// ============================================
// ONBOARDING FORM TEMPLATE MODEL
// ============================================
export interface IOnboardingFormField {
    id: string
    type: 'text' | 'number' | 'dropdown' | 'date' | 'file' | 'checkbox' | 'signature'
    label: string
    required: boolean
    options?: string[]
    conditionalLogic?: Record<string, any>
    validationRules?: Record<string, any>
}

export interface IOnboardingFormTemplate extends Document {
    _id: Types.ObjectId
    organizationId: Types.ObjectId
    name: string
    fields: IOnboardingFormField[]
    version: number
    createdAt: Date
    updatedAt: Date
}

const OnboardingFormFieldSchema = new Schema<IOnboardingFormField>({
    id: { type: String, required: true },
    type: { type: String, enum: ['text', 'number', 'dropdown', 'date', 'file', 'checkbox', 'signature'], required: true },
    label: { type: String, required: true },
    required: { type: Boolean, default: false },
    options: [{ type: String }],
    conditionalLogic: { type: Schema.Types.Mixed },
    validationRules: { type: Schema.Types.Mixed },
}, { _id: false })

const OnboardingFormTemplateSchema = new Schema<IOnboardingFormTemplate>({
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true },
    fields: [OnboardingFormFieldSchema],
    version: { type: Number, default: 1 },
}, { timestamps: true })

export const OnboardingFormTemplate = mongoose.model<IOnboardingFormTemplate>('OnboardingFormTemplate', OnboardingFormTemplateSchema)

// ============================================
// ONBOARDING FORM RESPONSE MODEL
// ============================================
export interface IOnboardingFormResponse extends Document {
    onboardingId: Types.ObjectId
    formTemplateId: Types.ObjectId
    responses: Record<string, any>
    status: 'IN_PROGRESS' | 'SUBMITTED' | 'NEEDS_REVISION'
    feedback?: { fieldId: string; message: string }[]
    submittedAt?: Date
    createdAt: Date
    updatedAt: Date
}

const OnboardingFormResponseSchema = new Schema<IOnboardingFormResponse>({
    onboardingId: { type: Schema.Types.ObjectId, ref: 'Onboarding', required: true, index: true },
    formTemplateId: { type: Schema.Types.ObjectId, ref: 'OnboardingFormTemplate', required: true },
    responses: { type: Schema.Types.Mixed, default: {} },
    status: { type: String, enum: ['IN_PROGRESS', 'SUBMITTED', 'NEEDS_REVISION'], default: 'IN_PROGRESS' },
    feedback: [{
        fieldId: { type: String, required: true },
        message: { type: String, required: true }
    }],
    submittedAt: { type: Date },
}, { timestamps: true })

OnboardingFormResponseSchema.index({ onboardingId: 1 }, { unique: true })

export const OnboardingFormResponse = mongoose.model<IOnboardingFormResponse>('OnboardingFormResponse', OnboardingFormResponseSchema)

// ============================================
// ORGANIZATION ONBOARDING SETTINGS MODEL
// ============================================
export interface IOrganizationOnboardingSettings extends Document {
    organizationId: Types.ObjectId
    offerReminderHours: number
    onboardingReminderHours: number
    offerExpiryDays: number
    maxReminders: number
    createdAt: Date
    updatedAt: Date
}

const OrganizationOnboardingSettingsSchema = new Schema<IOrganizationOnboardingSettings>({
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, unique: true },
    offerReminderHours: { type: Number, default: 48 },
    onboardingReminderHours: { type: Number, default: 72 },
    offerExpiryDays: { type: Number, default: 7 },
    maxReminders: { type: Number, default: 3 },
}, { timestamps: true })

export const OrganizationOnboardingSettings = mongoose.model<IOrganizationOnboardingSettings>('OrganizationOnboardingSettings', OrganizationOnboardingSettingsSchema)

// ============================================
// ACTIVITY LOG MODEL
// ============================================
export interface IActivityLog extends Document {
    organizationId: Types.ObjectId
    entityType: string
    entityId: Types.ObjectId
    eventType: string
    actorType: 'user' | 'system' | 'ai'
    performedBy?: Types.ObjectId
    metadata?: Record<string, any>
    timestamp: Date
}

const ActivityLogSchema = new Schema<IActivityLog>({
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    entityType: { type: String, required: true, index: true },
    entityId: { type: Schema.Types.ObjectId, required: true, index: true },
    eventType: { type: String, required: true },
    actorType: { type: String, enum: ['user', 'system', 'ai'], required: true, default: 'user' },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    metadata: { type: Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now, index: true },
}, { timestamps: false })

ActivityLogSchema.index({ entityId: 1, timestamp: -1 })

export const ActivityLog = mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema)

export * from './interview-transcript.model'
