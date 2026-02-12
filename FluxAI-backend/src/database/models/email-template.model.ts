import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IEmailTemplate extends Document {
    _id: Types.ObjectId
    organizationId: Types.ObjectId
    name: string // Internal name (e.g. "Candidate Rejection")
    subject: string // Template subject line with {{variables}}
    content: string // HTML content with {{variables}}
    variables: string[] // List of variables used (e.g. ['candidateName', 'jobTitle'])
    isActive: boolean
    createdAt: Date
    updatedAt: Date
}

const EmailTemplateSchema = new Schema<IEmailTemplate>({
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true },
    subject: { type: String, required: true },
    content: { type: String, required: true },
    variables: [{ type: String }],
    isActive: { type: Boolean, default: true },
}, { timestamps: true })

EmailTemplateSchema.index({ organizationId: 1, name: 1 }, { unique: true })

export const EmailTemplate = mongoose.model<IEmailTemplate>('EmailTemplate', EmailTemplateSchema)
