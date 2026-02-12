import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IScorecardSection {
    title: string
    rating?: number // 1-5 or 1-4
    notes?: string
}

export interface IScorecard extends Document {
    _id: Types.ObjectId
    organizationId: Types.ObjectId
    interviewId: Types.ObjectId
    applicationId: Types.ObjectId
    candidateId: Types.ObjectId
    interviewerId: Types.ObjectId
    overallRating: number // e.g. 1-4 (Strong No, No, Yes, Strong Yes)
    recommendation: 'STRONG_NO' | 'NO' | 'YES' | 'STRONG_YES'
    notes: string // Overall notes
    sections: IScorecardSection[]
    submittedAt: Date
    createdAt: Date
    updatedAt: Date
}

const ScorecardSchema = new Schema<IScorecard>({
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    interviewId: { type: Schema.Types.ObjectId, ref: 'Interview', required: true, index: true },
    applicationId: { type: Schema.Types.ObjectId, ref: 'JobApplication', required: true },
    candidateId: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true },
    interviewerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    overallRating: { type: Number, required: true }, // e.g., 1-4 scale
    recommendation: {
        type: String,
        enum: ['STRONG_NO', 'NO', 'YES', 'STRONG_YES'],
        required: true
    },
    notes: { type: String },
    sections: [{
        title: { type: String, required: true },
        rating: { type: Number },
        notes: { type: String }
    }],
    submittedAt: { type: Date, default: Date.now },
}, { timestamps: true })

ScorecardSchema.index({ interviewId: 1, interviewerId: 1 }, { unique: true }) // One scorecard per interviewer per interview

export const Scorecard = mongoose.model<IScorecard>('Scorecard', ScorecardSchema)
