import mongoose, { Schema, Document, Types } from 'mongoose'

/* ════════════════════════════════════════════════════
   PROSPECT — Outbound talent entity (separate from Candidate)
   ════════════════════════════════════════════════════ */
export interface IProspect extends Document {
    _id: Types.ObjectId
    organizationId: Types.ObjectId
    firstName: string
    lastName: string
    email: string
    phone?: string
    company?: string
    role?: string
    location?: string
    experience?: number
    skills?: string[]
    linkedinUrl?: string
    source: string
    status: 'new' | 'contacted' | 'replied' | 'converted' | 'nurturing' | 'not_interested'
    convertedCandidateId?: Types.ObjectId
    aiFitCache?: {
        jobId: Types.ObjectId
        score: number
        breakdown: any
        insights: string[]
        updatedAt: Date
    }
    // CRM Expansion Fields
    tags?: string[]
    bookmarkedBy?: Types.ObjectId[]
    pipelineStage?: string
    leadScore?: number
    lastContactedAt?: Date
    nextFollowUpAt?: Date
    socialProfiles?: {
        linkedin?: string
        github?: string
        twitter?: string
        portfolio?: string
    }
    enrichmentData?: Record<string, unknown>
    enrichedAt?: Date
    notes?: string
    isDeleted: boolean
    createdAt: Date
    updatedAt: Date
}

const ProspectSchema = new Schema<IProspect>({
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    firstName: { type: String, required: true },
    lastName: { type: String, default: '' },
    email: { type: String, required: true },
    phone: { type: String },
    company: { type: String },
    role: { type: String },
    location: { type: String },
    experience: { type: Number },
    skills: [{ type: String }],
    linkedinUrl: { type: String },
    source: { type: String, default: 'manual' },
    status: { type: String, enum: ['new', 'contacted', 'replied', 'converted', 'nurturing', 'not_interested'], default: 'new' },
    convertedCandidateId: { type: Schema.Types.ObjectId, ref: 'Candidate' },
    aiFitCache: {
        jobId: { type: Schema.Types.ObjectId, ref: 'Job' },
        score: { type: Number },
        breakdown: { type: Schema.Types.Mixed },
        insights: [{ type: String }],
        updatedAt: { type: Date }
    },
    // CRM Expansion Fields
    tags: [{ type: String }],
    bookmarkedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    pipelineStage: { type: String },
    leadScore: { type: Number, default: 0 },
    lastContactedAt: { type: Date },
    nextFollowUpAt: { type: Date },
    socialProfiles: {
        linkedin: { type: String },
        github: { type: String },
        twitter: { type: String },
        portfolio: { type: String },
    },
    enrichmentData: { type: Schema.Types.Mixed },
    enrichedAt: { type: Date },
    notes: { type: String },
    isDeleted: { type: Boolean, default: false },
}, { timestamps: true })

ProspectSchema.index({ organizationId: 1, email: 1 }, { unique: true })
ProspectSchema.index({ organizationId: 1, status: 1 })
ProspectSchema.index({ organizationId: 1, tags: 1 })
ProspectSchema.index({ organizationId: 1, leadScore: -1 })
ProspectSchema.index({ organizationId: 1, nextFollowUpAt: 1 })
ProspectSchema.index({ firstName: 'text', lastName: 'text', email: 'text', company: 'text', skills: 'text' })

export const Prospect = mongoose.model<IProspect>('Prospect', ProspectSchema)

/* ════════════════════════════════════════════════════
   PROSPECT LIST — Curated grouping for outreach
   ════════════════════════════════════════════════════ */
export interface IProspectList extends Document {
    _id: Types.ObjectId
    organizationId: Types.ObjectId
    name: string
    description?: string
    prospectIds: Types.ObjectId[]
    createdBy: Types.ObjectId
    createdAt: Date
    updatedAt: Date
}

const ProspectListSchema = new Schema<IProspectList>({
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    prospectIds: [{ type: Schema.Types.ObjectId, ref: 'Prospect' }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

export const ProspectList = mongoose.model<IProspectList>('ProspectList', ProspectListSchema)

/* ════════════════════════════════════════════════════
   CAMPAIGN — Outreach campaign targeting a list
   ════════════════════════════════════════════════════ */
export interface ICampaign extends Document {
    _id: Types.ObjectId
    organizationId: Types.ObjectId
    name: string
    listId: Types.ObjectId
    templateId: Types.ObjectId
    status: 'draft' | 'sending' | 'completed' | 'paused'
    stats: {
        sent: number
        opened: number
        replied: number
        bounced: number
    }
    scheduledAt?: Date
    createdBy: Types.ObjectId
    createdAt: Date
    updatedAt: Date
}

const CampaignSchema = new Schema<ICampaign>({
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true },
    listId: { type: Schema.Types.ObjectId, ref: 'ProspectList', required: true },
    templateId: { type: Schema.Types.ObjectId, ref: 'EmailTemplate', required: true },
    status: { type: String, enum: ['draft', 'sending', 'completed', 'paused'], default: 'draft' },
    stats: {
        sent: { type: Number, default: 0 },
        opened: { type: Number, default: 0 },
        replied: { type: Number, default: 0 },
        bounced: { type: Number, default: 0 },
    },
    scheduledAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

export const Campaign = mongoose.model<ICampaign>('Campaign', CampaignSchema)

/* ════════════════════════════════════════════════════
   MESSAGE — Individual email sent within a campaign
   ════════════════════════════════════════════════════ */
export interface IMessage extends Document {
    _id: Types.ObjectId
    campaignId: Types.ObjectId
    prospectId: Types.ObjectId
    status: 'queued' | 'sent' | 'opened' | 'replied' | 'bounced'
    sentAt?: Date
    openedAt?: Date
    repliedAt?: Date
    createdAt: Date
}

const MessageSchema = new Schema<IMessage>({
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
    prospectId: { type: Schema.Types.ObjectId, ref: 'Prospect', required: true },
    status: { type: String, enum: ['queued', 'sent', 'opened', 'replied', 'bounced'], default: 'queued' },
    sentAt: { type: Date },
    openedAt: { type: Date },
    repliedAt: { type: Date },
}, { timestamps: true })

MessageSchema.index({ campaignId: 1, prospectId: 1 }, { unique: true })

export const Message = mongoose.model<IMessage>('Message', MessageSchema)
