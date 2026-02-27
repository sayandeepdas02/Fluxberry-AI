import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IScoreBreakdown {
    skillScore: number;
    experienceScore: number;
    projectScore: number;
    educationScore: number;
    bonusScore: number;
}

export interface IScreeningResult extends Document {
    _id: Types.ObjectId;
    candidateId: Types.ObjectId;
    jobId: Types.ObjectId;
    organizationId: Types.ObjectId;

    status: 'PASSED' | 'FAILED_GATE' | 'PENDING' | 'ERROR';
    hardGateFailureReason?: string;

    scoreBreakdown?: IScoreBreakdown;
    finalScore?: number;
    confidenceScore?: number;
    scoringVersion: string;

    manualOverride?: {
        decision: 'SHORTLISTED' | 'REVIEW' | 'REJECTED';
        reason?: string;
    };

    createdAt: Date;
    updatedAt: Date;
}

const ScreeningResultSchema = new Schema<IScreeningResult>({
    candidateId: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true },
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },

    status: { type: String, enum: ['PASSED', 'FAILED_GATE', 'PENDING', 'ERROR'], default: 'PENDING' },
    hardGateFailureReason: { type: String },

    scoreBreakdown: {
        skillScore: { type: Number, default: 0 },
        experienceScore: { type: Number, default: 0 },
        projectScore: { type: Number, default: 0 },
        educationScore: { type: Number, default: 0 },
        bonusScore: { type: Number, default: 0 },
    },
    finalScore: { type: Number, default: 0 },
    confidenceScore: { type: Number, default: 0 },
    scoringVersion: { type: String, required: true },
    manualOverride: {
        decision: { type: String, enum: ['SHORTLISTED', 'REVIEW', 'REJECTED'] },
        reason: { type: String },
    },
}, { timestamps: true });

// Index for getting highest scores for a job
ScreeningResultSchema.index({ jobId: 1, finalScore: -1 });
// Strict tenant isolation ensures query always checks organizationId
ScreeningResultSchema.index({ organizationId: 1, candidateId: 1, jobId: 1 }, { unique: true });

export const ScreeningResult = mongoose.model<IScreeningResult>('ScreeningResult', ScreeningResultSchema);
