import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IJobScreeningProfile extends Document {
    _id: Types.ObjectId;
    jobId: Types.ObjectId;
    organizationId: Types.ObjectId;
    hardGates: {
        minimumSkills?: string[];
        minimumExperienceYears?: number;
        requiredEducationLevel?: string;
    };
    weights: {
        skillWeight: number;
        experienceWeight: number;
        projectWeight: number;
        educationWeight: number;
        bonusWeight: number;
    };
    /** V2-specific weights (5-weight model). Falls back to `weights` if absent. */
    weightsV2?: {
        skillWeight: number;
        experienceWeight: number;
        projectWeight: number;
        educationWeight: number;
        signalBoostWeight: number;
    };
    thresholds: {
        shortlist: number;
        reviewZone: number;
        autoReject: number;
    };
    /** Job-level scoring version toggle */
    scoringVersion?: 'v1' | 'v2';
    /** Required skills for V2 semantic matching (falls back to hardGates.minimumSkills) */
    requiredSkills?: string[];
    /** Cached job title for V2 experience role matching */
    jobTitle?: string;
    jdEmbedding?: number[];
    createdAt: Date;
    updatedAt: Date;
}

const JobScreeningProfileSchema = new Schema<IJobScreeningProfile>({
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    hardGates: {
        minimumSkills: [{ type: String }],
        minimumExperienceYears: { type: Number, default: 0 },
        requiredEducationLevel: { type: String, default: 'none' },
    },
    weights: {
        skillWeight: { type: Number, default: 0.4 },
        experienceWeight: { type: Number, default: 0.3 },
        projectWeight: { type: Number, default: 0.1 },
        educationWeight: { type: Number, default: 0.1 },
        bonusWeight: { type: Number, default: 0.1 },
    },
    weightsV2: {
        skillWeight:      { type: Number, default: 0.35 },
        experienceWeight: { type: Number, default: 0.30 },
        projectWeight:    { type: Number, default: 0.20 },
        educationWeight:  { type: Number, default: 0.10 },
        signalBoostWeight:{ type: Number, default: 0.05 },
    },
    thresholds: {
        shortlist: { type: Number, default: 80 },
        reviewZone: { type: Number, default: 60 },
        autoReject: { type: Number, default: 0 },
    },
    scoringVersion: { type: String, enum: ['v1', 'v2'], default: 'v2' },
    requiredSkills: [{ type: String }],
    jobTitle: { type: String },
    jdEmbedding: [{ type: Number }]
}, { timestamps: true });

JobScreeningProfileSchema.index({ jobId: 1, organizationId: 1 }, { unique: true });

export const JobScreeningProfile = mongoose.model<IJobScreeningProfile>('JobScreeningProfile', JobScreeningProfileSchema);
