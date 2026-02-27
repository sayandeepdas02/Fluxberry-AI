import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IResumeParsedData {
    skills?: string[];
    experience?: {
        title?: string;
        company?: string;
        durationMonths?: number;
        startDate?: string;
        endDate?: string;
        description?: string;
    }[];
    projects?: {
        name?: string;
        description?: string;
    }[];
    education?: {
        degree?: string;
        institution?: string;
        level?: string;
    }[];
    rawText?: string;
}

export interface IResumeProfile extends Document {
    _id: Types.ObjectId;
    candidateId: Types.ObjectId;
    organizationId: Types.ObjectId;
    parsedAt?: Date | null;
    parsedData?: IResumeParsedData;
    embeddings?: {
        resumeVector?: number[];
        projectVectors?: number[][];
    };
    createdAt: Date;
    updatedAt: Date;
}

const ResumeProfileSchema = new Schema<IResumeProfile>({
    candidateId: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true, index: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    parsedAt: { type: Date, default: null, index: true },
    parsedData: { type: Schema.Types.Mixed },
    embeddings: {
        resumeVector: [{ type: Number }],
        projectVectors: [[{ type: Number }]]
    }
}, { timestamps: true });

// Strict tenant isolation index
ResumeProfileSchema.index({ organizationId: 1, candidateId: 1 }, { unique: true });

export const ResumeProfile = mongoose.model<IResumeProfile>('ResumeProfile', ResumeProfileSchema);
