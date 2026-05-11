import mongoose, { Schema, Document, Types } from 'mongoose'

/* ════════════════════════════════════════════════════
   REFERRAL PROGRAM — Organization-level referral config
   ════════════════════════════════════════════════════ */

export interface IReferralProgram extends Document {
    _id: Types.ObjectId
    organizationId: Types.ObjectId
    name: string
    isActive: boolean
    rewardType: 'cash' | 'points' | 'custom'
    rewardAmount: number
    rewardDescription?: string
    rules: {
        eligibleDepartments?: string[]
        requireApproval: boolean
        cooldownDays?: number
    }
    createdBy: Types.ObjectId
    createdAt: Date
    updatedAt: Date
}

const ReferralProgramSchema = new Schema<IReferralProgram>({
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    rewardType: { type: String, enum: ['cash', 'points', 'custom'], default: 'cash' },
    rewardAmount: { type: Number, default: 0 },
    rewardDescription: { type: String },
    rules: {
        eligibleDepartments: [{ type: String }],
        requireApproval: { type: Boolean, default: true },
        cooldownDays: { type: Number, default: 0 },
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })

export const ReferralProgram = mongoose.model<IReferralProgram>('ReferralProgram', ReferralProgramSchema)

/* ════════════════════════════════════════════════════
   REFERRAL — Individual referral submission
   ════════════════════════════════════════════════════ */

export const ReferralStatus = {
    SUBMITTED: 'submitted',
    IN_PROGRESS: 'in_progress',
    HIRED: 'hired',
    REJECTED: 'rejected',
    REWARDED: 'rewarded',
} as const
export type ReferralStatusValue = typeof ReferralStatus[keyof typeof ReferralStatus]

export interface IReferral extends Document {
    _id: Types.ObjectId
    organizationId: Types.ObjectId
    programId: Types.ObjectId
    referrerId: Types.ObjectId
    referredCandidateId?: Types.ObjectId
    applicationId?: Types.ObjectId
    jobId?: Types.ObjectId
    referredName: string
    referredEmail: string
    referredPhone?: string
    referralNote?: string
    referralLink?: string
    status: ReferralStatusValue
    submittedAt: Date
    hiredAt?: Date
    createdAt: Date
    updatedAt: Date
}

const ReferralSchema = new Schema<IReferral>({
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    programId: { type: Schema.Types.ObjectId, ref: 'ReferralProgram', required: true },
    referrerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    referredCandidateId: { type: Schema.Types.ObjectId, ref: 'Candidate' },
    applicationId: { type: Schema.Types.ObjectId, ref: 'JobApplication' },
    jobId: { type: Schema.Types.ObjectId, ref: 'Job' },
    referredName: { type: String, required: true },
    referredEmail: { type: String, required: true },
    referredPhone: { type: String },
    referralNote: { type: String },
    referralLink: { type: String },
    status: { type: String, enum: Object.values(ReferralStatus), default: ReferralStatus.SUBMITTED },
    submittedAt: { type: Date, default: Date.now },
    hiredAt: { type: Date },
}, { timestamps: true })

ReferralSchema.index({ organizationId: 1, referrerId: 1 })
ReferralSchema.index({ organizationId: 1, referredEmail: 1 })
ReferralSchema.index({ referralLink: 1 })

export const Referral = mongoose.model<IReferral>('Referral', ReferralSchema)

/* ════════════════════════════════════════════════════
   REFERRAL REWARD — Reward tracking for referrals
   ════════════════════════════════════════════════════ */

export interface IReferralReward extends Document {
    _id: Types.ObjectId
    referralId: Types.ObjectId
    referrerId: Types.ObjectId
    organizationId: Types.ObjectId
    amount: number
    type: string
    status: 'pending' | 'approved' | 'paid' | 'rejected'
    approvedBy?: Types.ObjectId
    approvedAt?: Date
    paidAt?: Date
    createdAt: Date
}

const ReferralRewardSchema = new Schema<IReferralReward>({
    referralId: { type: Schema.Types.ObjectId, ref: 'Referral', required: true, index: true },
    referrerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    amount: { type: Number, required: true },
    type: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'paid', 'rejected'], default: 'pending' },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    paidAt: { type: Date },
}, { timestamps: { createdAt: true, updatedAt: false } })

export const ReferralReward = mongoose.model<IReferralReward>('ReferralReward', ReferralRewardSchema)
