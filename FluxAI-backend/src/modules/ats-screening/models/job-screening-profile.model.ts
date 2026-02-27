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
    thresholds: {
        shortlist: number;
        reviewZone: number;
        autoReject: number;
    };
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
    thresholds: {
        shortlist: { type: Number, default: 80 },
        reviewZone: { type: Number, default: 60 },
        autoReject: { type: Number, default: 0 },
    },
    jdEmbedding: [{ type: Number }]
}, { timestamps: true });

JobScreeningProfileSchema.index({ jobId: 1, organizationId: 1 }, { unique: true });

export const JobScreeningProfile = mongoose.model<IJobScreeningProfile>('JobScreeningProfile', JobScreeningProfileSchema);
