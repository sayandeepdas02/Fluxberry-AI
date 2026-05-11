import mongoose, { Schema, Document, Types } from 'mongoose'

/* ════════════════════════════════════════════════════
   INTERVIEW FEEDBACK — Structured interviewer feedback
   ════════════════════════════════════════════════════ */

export interface IFeedbackDimension {
    dimension: string
    score: number
    maxScore: number
    notes?: string
}

export interface IInterviewFeedback extends Document {
    _id: Types.ObjectId
    organizationId: Types.ObjectId
    applicationId: Types.ObjectId
    interviewId?: Types.ObjectId
    reviewerId: Types.ObjectId
    scores: IFeedbackDimension[]
    overallScore: number
    recommendation: 'strong_hire' | 'hire' | 'no_hire' | 'strong_no_hire' | 'needs_review'
    strengths?: string
    concerns?: string
    notes?: string
    calibrated: boolean
    submittedAt: Date
    createdAt: Date
    updatedAt: Date
}

const FeedbackDimensionSchema = new Schema<IFeedbackDimension>({
    dimension: { type: String, required: true },
    score: { type: Number, required: true },
    maxScore: { type: Number, default: 5 },
    notes: { type: String },
}, { _id: false })

const InterviewFeedbackSchema = new Schema<IInterviewFeedback>({
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    applicationId: { type: Schema.Types.ObjectId, ref: 'JobApplication', required: true },
    interviewId: { type: Schema.Types.ObjectId },
    reviewerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    scores: [FeedbackDimensionSchema],
    overallScore: { type: Number, default: 0 },
    recommendation: { type: String, enum: ['strong_hire', 'hire', 'no_hire', 'strong_no_hire', 'needs_review'], required: true },
    strengths: { type: String },
    concerns: { type: String },
    notes: { type: String },
    calibrated: { type: Boolean, default: false },
    submittedAt: { type: Date, default: Date.now },
}, { timestamps: true })

InterviewFeedbackSchema.index({ applicationId: 1, reviewerId: 1 }, { unique: true })

export const InterviewFeedback = mongoose.model<IInterviewFeedback>('InterviewFeedback', InterviewFeedbackSchema)

/* ════════════════════════════════════════════════════
   APPROVAL CHAIN — Sequential approval workflows
   ════════════════════════════════════════════════════ */

export interface IApprovalStep {
    approverId: Types.ObjectId
    status: 'pending' | 'approved' | 'rejected'
    decidedAt?: Date
    notes?: string
}

export interface IApprovalChain extends Document {
    _id: Types.ObjectId
    organizationId: Types.ObjectId
    entityType: 'offer' | 'hire' | 'reject' | 'requisition'
    entityId: Types.ObjectId
    jobId?: Types.ObjectId
    steps: IApprovalStep[]
    currentStep: number
    status: 'pending' | 'approved' | 'rejected'
    initiatedBy: Types.ObjectId
    createdAt: Date
    updatedAt: Date
}

const ApprovalStepSchema = new Schema<IApprovalStep>({
    approverId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    decidedAt: { type: Date },
    notes: { type: String },
}, { _id: false })

const ApprovalChainSchema = new Schema<IApprovalChain>({
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    entityType: { type: String, enum: ['offer', 'hire', 'reject', 'requisition'], required: true },
    entityId: { type: Schema.Types.ObjectId, required: true },
    jobId: { type: Schema.Types.ObjectId, ref: 'Job' },
    steps: [ApprovalStepSchema],
    currentStep: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    initiatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })

ApprovalChainSchema.index({ entityType: 1, entityId: 1 })

export const ApprovalChain = mongoose.model<IApprovalChain>('ApprovalChain', ApprovalChainSchema)

/* ════════════════════════════════════════════════════
   DISCUSSION THREAD — Contextual discussions
   ════════════════════════════════════════════════════ */

export interface IDiscussionMessage {
    userId: Types.ObjectId
    content: string
    createdAt: Date
}

export interface IDiscussionThread extends Document {
    _id: Types.ObjectId
    organizationId: Types.ObjectId
    entityType: 'application' | 'candidate' | 'job' | 'referral'
    entityId: Types.ObjectId
    messages: IDiscussionMessage[]
    status: 'open' | 'resolved'
    createdAt: Date
    updatedAt: Date
}

const DiscussionMessageSchema = new Schema<IDiscussionMessage>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
}, { _id: false })

const DiscussionThreadSchema = new Schema<IDiscussionThread>({
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    entityType: { type: String, enum: ['application', 'candidate', 'job', 'referral'], required: true },
    entityId: { type: Schema.Types.ObjectId, required: true },
    messages: [DiscussionMessageSchema],
    status: { type: String, enum: ['open', 'resolved'], default: 'open' },
}, { timestamps: true })

DiscussionThreadSchema.index({ entityType: 1, entityId: 1 })

export const DiscussionThread = mongoose.model<IDiscussionThread>('DiscussionThread', DiscussionThreadSchema)

/* ════════════════════════════════════════════════════
   HIRING COMMITTEE — Decision group for a job
   ════════════════════════════════════════════════════ */

export interface IHiringCommittee extends Document {
    _id: Types.ObjectId
    organizationId: Types.ObjectId
    jobId: Types.ObjectId
    memberIds: Types.ObjectId[]
    decisionPolicy: 'unanimous' | 'majority' | 'any'
    createdAt: Date
    updatedAt: Date
}

const HiringCommitteeSchema = new Schema<IHiringCommittee>({
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
    memberIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    decisionPolicy: { type: String, enum: ['unanimous', 'majority', 'any'], default: 'majority' },
}, { timestamps: true })

export const HiringCommittee = mongoose.model<IHiringCommittee>('HiringCommittee', HiringCommitteeSchema)
