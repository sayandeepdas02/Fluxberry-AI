import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IQuestion {
    questionText: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctAnswer: string;
    timeLimit: number;
    order: number;
}

export interface ICustomField {
    fieldName: string;
    fieldType: string;
    required: boolean;
    options?: string;
}

export interface IJob extends Document {
    title: string;
    description?: string;
    roleType?: string;
    experienceLevel?: string;
    location?: string;
    status: string;
    shareableLink?: string;
    userId: mongoose.Schema.Types.ObjectId;
    testEnabled: boolean;
    testDuration?: number;
    passingScore?: number;
    questions: IQuestion[];
    customFields: ICustomField[];
    createdAt: Date;
    updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>({
    questionText: { type: String, required: true },
    optionA: { type: String, required: true },
    optionB: { type: String, required: true },
    optionC: { type: String, required: true },
    optionD: { type: String, required: true },
    correctAnswer: { type: String, required: true },
    timeLimit: { type: Number, default: 30 },
    order: { type: Number, default: 0 },
});

const CustomFieldSchema = new Schema<ICustomField>({
    fieldName: { type: String, required: true },
    fieldType: { type: String, required: true },
    required: { type: Boolean, default: false },
    options: { type: String },
});

const JobSchema = new Schema<IJob>(
    {
        title: { type: String, required: true },
        description: String,
        roleType: String,
        experienceLevel: String,
        location: String,
        status: { type: String, default: 'draft' },
        shareableLink: { type: String, unique: true, sparse: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        testEnabled: { type: Boolean, default: false },
        testDuration: Number,
        passingScore: Number,
        questions: [QuestionSchema],
        customFields: [CustomFieldSchema],
    },
    { timestamps: true }
);

const Job: Model<IJob> = mongoose.models.Job || mongoose.model<IJob>('Job', JobSchema);

export default Job;
