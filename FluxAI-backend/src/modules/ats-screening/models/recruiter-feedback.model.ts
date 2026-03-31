import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * RecruiterFeedback — Captures implicit learning signals from recruiter actions.
 *
 * When a recruiter shortlists or rejects a candidate, we store the signal
 * along with the candidate's skill profile and score. This data powers:
 *
 * 1. Lightweight micro-adjustments to scoring weights (V1 — rule-based)
 * 2. Future ML ranking model / reinforcement learning (V2 — planned)
 *
 * Each record represents a single recruiter action on a single candidate.
 */

export type FeedbackLabel = 'POSITIVE' | 'NEGATIVE';

export interface IRecruiterFeedback extends Document {
    _id: Types.ObjectId;
    jobId: Types.ObjectId;
    candidateId: Types.ObjectId;
    organizationId: Types.ObjectId;

    /** The signal type — POSITIVE (shortlisted) or NEGATIVE (rejected) */
    label: FeedbackLabel;

    /** The recruiter action that generated this signal */
    action: 'SHORTLISTED' | 'REVIEW' | 'REJECTED';

    /** Snapshot of candidate's skills at time of feedback (for pattern analysis) */
    candidateSkills: string[];

    /** Candidate's final score at time of feedback */
    candidateScore: number;

    /** Score breakdown snapshot for pattern analysis */
    scoreBreakdown?: {
        skillScore: number;
        experienceScore: number;
        projectScore: number;
        educationScore: number;
    };

    /** The recruiter who performed the action */
    performedBy: Types.ObjectId;

    createdAt: Date;
    updatedAt: Date;
}

const RecruiterFeedbackSchema = new Schema<IRecruiterFeedback>({
    jobId:          { type: Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
    candidateId:    { type: Schema.Types.ObjectId, ref: 'Candidate', required: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },

    label:  { type: String, enum: ['POSITIVE', 'NEGATIVE'], required: true },
    action: { type: String, enum: ['SHORTLISTED', 'REVIEW', 'REJECTED'], required: true },

    candidateSkills: [{ type: String }],
    candidateScore:  { type: Number, default: 0 },
    scoreBreakdown: {
        skillScore:      { type: Number },
        experienceScore: { type: Number },
        projectScore:    { type: Number },
        educationScore:  { type: Number },
    },

    performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

// Query patterns: "all feedback for this job" and "all feedback by this org"
RecruiterFeedbackSchema.index({ jobId: 1, label: 1 });
RecruiterFeedbackSchema.index({ organizationId: 1, jobId: 1 });
// Prevent duplicate feedback for the same candidate+job+action combo
RecruiterFeedbackSchema.index({ jobId: 1, candidateId: 1, action: 1 }, { unique: true });

export const RecruiterFeedback = mongoose.model<IRecruiterFeedback>('RecruiterFeedback', RecruiterFeedbackSchema);
