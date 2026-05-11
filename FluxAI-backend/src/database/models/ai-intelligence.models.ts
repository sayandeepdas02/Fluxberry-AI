import mongoose, { Schema, Document, Types } from 'mongoose'

/* ════════════════════════════════════════════════════
   AI RANKING RESULT — Materialized ranking for a job
   ════════════════════════════════════════════════════ */

export interface IAIRankingEntry {
    candidateId: Types.ObjectId
    score: number
    confidence: number
    explanation: string
    rank: number
}

export interface IAIRankingResult extends Document {
    _id: Types.ObjectId
    jobId: Types.ObjectId
    organizationId: Types.ObjectId
    rankings: IAIRankingEntry[]
    totalCandidates: number
    isAIGenerated: boolean
    generatedAt: Date
    expiresAt: Date
    createdAt: Date
}

const AIRankingResultSchema = new Schema<IAIRankingResult>({
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    rankings: [{
        candidateId: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true },
        score: { type: Number, required: true },
        confidence: { type: Number, required: true },
        explanation: { type: String, default: '' },
        rank: { type: Number, required: true },
    }],
    totalCandidates: { type: Number, default: 0 },
    isAIGenerated: { type: Boolean, default: true },
    generatedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
}, { timestamps: { createdAt: true, updatedAt: false } })

AIRankingResultSchema.index({ jobId: 1, organizationId: 1 })

export const AIRankingResult = mongoose.model<IAIRankingResult>('AIRankingResult', AIRankingResultSchema)

/* ════════════════════════════════════════════════════
   AI SCORECARD — Structured interview scorecard
   ════════════════════════════════════════════════════ */

export interface IAIScorecardDimension {
    name: string
    score: number
    maxScore: number
    evidence: string[]
    notes?: string
}

export interface IAIScorecard extends Document {
    _id: Types.ObjectId
    sessionId: string
    jobId: Types.ObjectId
    candidateId: Types.ObjectId
    organizationId: Types.ObjectId
    dimensions: IAIScorecardDimension[]
    overallScore: number
    recommendation: 'STRONG_HIRE' | 'HIRE' | 'NO_HIRE' | 'STRONG_NO_HIRE' | 'FURTHER_REVIEW'
    summary: string
    isAIGenerated: boolean
    generatedAt: Date
    createdAt: Date
}

const AIScorecardSchema = new Schema<IAIScorecard>({
    sessionId: { type: String, required: true, index: true },
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    candidateId: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    dimensions: [{
        name: { type: String, required: true },
        score: { type: Number, required: true },
        maxScore: { type: Number, default: 10 },
        evidence: [{ type: String }],
        notes: { type: String },
    }],
    overallScore: { type: Number, default: 0 },
    recommendation: {
        type: String,
        enum: ['STRONG_HIRE', 'HIRE', 'NO_HIRE', 'STRONG_NO_HIRE', 'FURTHER_REVIEW'],
        default: 'FURTHER_REVIEW',
    },
    summary: { type: String, default: '' },
    isAIGenerated: { type: Boolean, default: true },
    generatedAt: { type: Date, default: Date.now },
}, { timestamps: { createdAt: true, updatedAt: false } })

AIScorecardSchema.index({ sessionId: 1 }, { unique: true })
AIScorecardSchema.index({ candidateId: 1, jobId: 1 })

export const AIScorecard = mongoose.model<IAIScorecard>('AIScorecard', AIScorecardSchema)

/* ════════════════════════════════════════════════════
   AI OUTREACH DRAFT — Generated outreach email
   ════════════════════════════════════════════════════ */

export interface IAIOutreachDraft extends Document {
    _id: Types.ObjectId
    prospectId: Types.ObjectId
    jobId?: Types.ObjectId
    organizationId: Types.ObjectId
    subject: string
    body: string
    tone: 'professional' | 'casual' | 'enthusiastic'
    personalizationScore: number
    isAIGenerated: boolean
    createdAt: Date
}

const AIOutreachDraftSchema = new Schema<IAIOutreachDraft>({
    prospectId: { type: Schema.Types.ObjectId, ref: 'Prospect', required: true },
    jobId: { type: Schema.Types.ObjectId, ref: 'Job' },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    subject: { type: String, required: true },
    body: { type: String, required: true },
    tone: { type: String, enum: ['professional', 'casual', 'enthusiastic'], default: 'professional' },
    personalizationScore: { type: Number, default: 0 },
    isAIGenerated: { type: Boolean, default: true },
}, { timestamps: { createdAt: true, updatedAt: false } })

AIOutreachDraftSchema.index({ prospectId: 1, organizationId: 1 })

export const AIOutreachDraft = mongoose.model<IAIOutreachDraft>('AIOutreachDraft', AIOutreachDraftSchema)
