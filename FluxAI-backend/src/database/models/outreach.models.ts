import mongoose, { Schema, Document, Types } from 'mongoose'

/* ════════════════════════════════════════════════════
   EMAIL SEQUENCE — Multi-step outreach cadence
   ════════════════════════════════════════════════════ */

export interface ISequenceStep {
    order: number
    templateId: Types.ObjectId
    delayHours: number
    type: 'initial' | 'followup' | 'breakup'
}

export interface IEmailSequence extends Document {
    _id: Types.ObjectId
    organizationId: Types.ObjectId
    name: string
    steps: ISequenceStep[]
    status: 'draft' | 'active' | 'paused' | 'archived'
    createdBy: Types.ObjectId
    createdAt: Date
    updatedAt: Date
}

const SequenceStepSchema = new Schema<ISequenceStep>({
    order: { type: Number, required: true },
    templateId: { type: Schema.Types.ObjectId, ref: 'EmailTemplate', required: true },
    delayHours: { type: Number, default: 24 },
    type: { type: String, enum: ['initial', 'followup', 'breakup'], default: 'followup' },
}, { _id: false })

const EmailSequenceSchema = new Schema<IEmailSequence>({
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true },
    steps: [SequenceStepSchema],
    status: { type: String, enum: ['draft', 'active', 'paused', 'archived'], default: 'draft' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })

export const EmailSequence = mongoose.model<IEmailSequence>('EmailSequence', EmailSequenceSchema)

/* ════════════════════════════════════════════════════
   OUTREACH CAMPAIGN — Sequence + target list execution
   ════════════════════════════════════════════════════ */

export interface IOutreachCampaign extends Document {
    _id: Types.ObjectId
    organizationId: Types.ObjectId
    name: string
    sequenceId: Types.ObjectId
    prospectListId: Types.ObjectId
    status: 'draft' | 'active' | 'paused' | 'completed'
    stats: { sent: number; opened: number; replied: number; bounced: number }
    scheduledAt?: Date
    createdBy: Types.ObjectId
    createdAt: Date
    updatedAt: Date
}

const OutreachCampaignSchema = new Schema<IOutreachCampaign>({
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true },
    sequenceId: { type: Schema.Types.ObjectId, ref: 'EmailSequence', required: true },
    prospectListId: { type: Schema.Types.ObjectId, ref: 'ProspectList', required: true },
    status: { type: String, enum: ['draft', 'active', 'paused', 'completed'], default: 'draft' },
    stats: {
        sent: { type: Number, default: 0 },
        opened: { type: Number, default: 0 },
        replied: { type: Number, default: 0 },
        bounced: { type: Number, default: 0 },
    },
    scheduledAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })

export const OutreachCampaign = mongoose.model<IOutreachCampaign>('OutreachCampaign', OutreachCampaignSchema)

/* ════════════════════════════════════════════════════
   OUTREACH MESSAGE — Individual tracked email
   ════════════════════════════════════════════════════ */

export interface IOutreachMessage extends Document {
    _id: Types.ObjectId
    campaignId: Types.ObjectId
    prospectId: Types.ObjectId
    sequenceStep: number
    status: 'queued' | 'sent' | 'opened' | 'replied' | 'bounced' | 'scheduled'
    trackingPixelId?: string
    sentAt?: Date
    openedAt?: Date
    repliedAt?: Date
    scheduledSendAt?: Date
    createdAt: Date
}

const OutreachMessageSchema = new Schema<IOutreachMessage>({
    campaignId: { type: Schema.Types.ObjectId, ref: 'OutreachCampaign', required: true, index: true },
    prospectId: { type: Schema.Types.ObjectId, ref: 'Prospect', required: true },
    sequenceStep: { type: Number, required: true },
    status: { type: String, enum: ['queued', 'sent', 'opened', 'replied', 'bounced', 'scheduled'], default: 'queued' },
    trackingPixelId: { type: String, index: true },
    sentAt: { type: Date },
    openedAt: { type: Date },
    repliedAt: { type: Date },
    scheduledSendAt: { type: Date },
}, { timestamps: { createdAt: true, updatedAt: false } })

OutreachMessageSchema.index({ campaignId: 1, prospectId: 1, sequenceStep: 1 }, { unique: true })

export const OutreachMessage = mongoose.model<IOutreachMessage>('OutreachMessage', OutreachMessageSchema)

/* ════════════════════════════════════════════════════
   RECRUITER TEMPLATE — Reusable email templates
   ════════════════════════════════════════════════════ */

export interface IRecruiterTemplate extends Document {
    _id: Types.ObjectId
    organizationId: Types.ObjectId
    name: string
    subject: string
    body: string
    type: 'initial' | 'followup' | 'nurture' | 'rejection' | 'offer'
    variables: string[]
    createdBy: Types.ObjectId
    createdAt: Date
    updatedAt: Date
}

const RecruiterTemplateSchema = new Schema<IRecruiterTemplate>({
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true },
    subject: { type: String, required: true },
    body: { type: String, required: true },
    type: { type: String, enum: ['initial', 'followup', 'nurture', 'rejection', 'offer'], default: 'initial' },
    variables: [{ type: String }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })

export const RecruiterTemplate = mongoose.model<IRecruiterTemplate>('RecruiterTemplate', RecruiterTemplateSchema)
