import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAnswer {
    questionId: string;
    selectedAnswer: string;
    isCorrect: boolean;
    timeTaken: number;
    createdAt: Date;
}

export interface ICandidate extends Document {
    jobId: mongoose.Schema.Types.ObjectId;
    name: string;
    email: string;
    resumeUrl?: string;
    currentCTC?: number;
    expectedCTC?: number;
    customFields?: Record<string, any>;
    parsedResume?: Record<string, any>;
    testScore?: number;
    testPassed?: boolean;
    answers: IAnswer[];
    createdAt: Date;
}

const AnswerSchema = new Schema<IAnswer>({
    questionId: { type: String, required: true },
    selectedAnswer: { type: String, required: true },
    isCorrect: { type: Boolean, required: true },
    timeTaken: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
});

const CandidateSchema = new Schema<ICandidate>(
    {
        jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
        name: { type: String, required: true },
        email: { type: String, required: true },
        resumeUrl: String,
        currentCTC: Number,
        expectedCTC: Number,
        customFields: Schema.Types.Mixed,
        parsedResume: Schema.Types.Mixed,
        testScore: Number,
        testPassed: Boolean,
        answers: [AnswerSchema],
    },
    { timestamps: true }
);

const Candidate: Model<ICandidate> = mongoose.models.Candidate || mongoose.model<ICandidate>('Candidate', CandidateSchema);

export default Candidate;
