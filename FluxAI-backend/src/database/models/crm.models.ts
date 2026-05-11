import mongoose, { Schema, Document, Types } from 'mongoose'

/* ════════════════════════════════════════════════════
   TALENT POOL — Static or Smart (query-based) grouping
   ════════════════════════════════════════════════════ */

export const TalentPoolType = {
    STATIC: 'static',
    SMART: 'smart',
} as const
export type TalentPoolTypeValue = typeof TalentPoolType[keyof typeof TalentPoolType]

export interface ITalentPool extends Document {
    _id: Types.ObjectId
    organizationId: Types.ObjectId
    name: string
    description?: string
    type: TalentPoolTypeValue
    /** MongoDB query object for smart pools (auto-populated) */
    smartQuery?: Record<string, unknown>
    /** Manually added candidate IDs (static pools) */
    candidateIds: Types.ObjectId[]
    tags: string[]
    ownerId: Types.ObjectId
    candidateCount: number
    lastRefreshedAt?: Date
    createdAt: Date
    updatedAt: Date
}

const TalentPoolSchema = new Schema<ITalentPool>({
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    type: { type: String, enum: Object.values(TalentPoolType), default: TalentPoolType.STATIC },
    smartQuery: { type: Schema.Types.Mixed },
    candidateIds: [{ type: Schema.Types.ObjectId, ref: 'Candidate' }],
    tags: [{ type: String }],
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    candidateCount: { type: Number, default: 0 },
    lastRefreshedAt: { type: Date },
}, { timestamps: true })

TalentPoolSchema.index({ organizationId: 1, name: 1 })
TalentPoolSchema.index({ organizationId: 1, ownerId: 1 })
TalentPoolSchema.index({ organizationId: 1, tags: 1 })

export const TalentPool = mongoose.model<ITalentPool>('TalentPool', TalentPoolSchema)

/* ════════════════════════════════════════════════════
   SAVED SEARCH — Reusable candidate search filters
   ════════════════════════════════════════════════════ */

export interface ISavedSearch extends Document {
    _id: Types.ObjectId
    organizationId: Types.ObjectId
    name: string
    /** Full query parameters (skills, location, experience, etc.) */
    query: Record<string, unknown>
    /** Applied filter state for UI restoration */
    filters: Record<string, unknown>
    resultCount: number
    createdBy: Types.ObjectId
    lastRunAt?: Date
    createdAt: Date
    updatedAt: Date
}

const SavedSearchSchema = new Schema<ISavedSearch>({
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true },
    query: { type: Schema.Types.Mixed, required: true },
    filters: { type: Schema.Types.Mixed, default: {} },
    resultCount: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    lastRunAt: { type: Date },
}, { timestamps: true })

SavedSearchSchema.index({ organizationId: 1, createdBy: 1 })

export const SavedSearch = mongoose.model<ISavedSearch>('SavedSearch', SavedSearchSchema)

/* ════════════════════════════════════════════════════
   CANDIDATE BOOKMARK — Per-recruiter bookmarks
   ════════════════════════════════════════════════════ */

export interface ICandidateBookmark extends Document {
    _id: Types.ObjectId
    organizationId: Types.ObjectId
    candidateId: Types.ObjectId
    userId: Types.ObjectId
    notes?: string
    createdAt: Date
}

const CandidateBookmarkSchema = new Schema<ICandidateBookmark>({
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    candidateId: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    notes: { type: String },
}, { timestamps: { createdAt: true, updatedAt: false } })

CandidateBookmarkSchema.index({ organizationId: 1, userId: 1 })
CandidateBookmarkSchema.index({ organizationId: 1, candidateId: 1, userId: 1 }, { unique: true })

export const CandidateBookmark = mongoose.model<ICandidateBookmark>('CandidateBookmark', CandidateBookmarkSchema)

/* ════════════════════════════════════════════════════
   FOLLOW-UP REMINDER — Recruiter task scheduling
   ════════════════════════════════════════════════════ */

export const ReminderStatus = {
    PENDING: 'pending',
    COMPLETED: 'completed',
    DISMISSED: 'dismissed',
    OVERDUE: 'overdue',
} as const
export type ReminderStatusValue = typeof ReminderStatus[keyof typeof ReminderStatus]

export const ReminderType = {
    CALL: 'call',
    EMAIL: 'email',
    REVIEW: 'review',
    FOLLOWUP: 'followup',
    MEETING: 'meeting',
} as const
export type ReminderTypeValue = typeof ReminderType[keyof typeof ReminderType]

export interface IFollowUpReminder extends Document {
    _id: Types.ObjectId
    organizationId: Types.ObjectId
    candidateId: Types.ObjectId
    userId: Types.ObjectId
    dueAt: Date
    status: ReminderStatusValue
    note?: string
    type: ReminderTypeValue
    completedAt?: Date
    createdAt: Date
    updatedAt: Date
}

const FollowUpReminderSchema = new Schema<IFollowUpReminder>({
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    candidateId: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    dueAt: { type: Date, required: true },
    status: { type: String, enum: Object.values(ReminderStatus), default: ReminderStatus.PENDING },
    note: { type: String },
    type: { type: String, enum: Object.values(ReminderType), default: ReminderType.FOLLOWUP },
    completedAt: { type: Date },
}, { timestamps: true })

FollowUpReminderSchema.index({ organizationId: 1, userId: 1, status: 1 })
FollowUpReminderSchema.index({ dueAt: 1, status: 1 }) // For cron-based overdue checks
FollowUpReminderSchema.index({ organizationId: 1, candidateId: 1 })

export const FollowUpReminder = mongoose.model<IFollowUpReminder>('FollowUpReminder', FollowUpReminderSchema)

/* ════════════════════════════════════════════════════
   RELATIONSHIP LOG — Interaction history with candidates
   ════════════════════════════════════════════════════ */

export const InteractionType = {
    EMAIL: 'email',
    CALL: 'call',
    MEETING: 'meeting',
    NOTE: 'note',
    LINKEDIN_MESSAGE: 'linkedin_message',
    INTERVIEW: 'interview',
    REFERRAL: 'referral',
    SYSTEM: 'system',
} as const
export type InteractionTypeValue = typeof InteractionType[keyof typeof InteractionType]

export interface IRelationshipLog extends Document {
    _id: Types.ObjectId
    organizationId: Types.ObjectId
    candidateId: Types.ObjectId
    userId: Types.ObjectId
    interactionType: InteractionTypeValue
    summary: string
    metadata?: Record<string, unknown>
    occurredAt: Date
    createdAt: Date
}

const RelationshipLogSchema = new Schema<IRelationshipLog>({
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    candidateId: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    interactionType: { type: String, enum: Object.values(InteractionType), required: true },
    summary: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
    occurredAt: { type: Date, default: Date.now },
}, { timestamps: { createdAt: true, updatedAt: false } })

RelationshipLogSchema.index({ organizationId: 1, candidateId: 1, occurredAt: -1 })
RelationshipLogSchema.index({ organizationId: 1, userId: 1 })

export const RelationshipLog = mongoose.model<IRelationshipLog>('RelationshipLog', RelationshipLogSchema)
