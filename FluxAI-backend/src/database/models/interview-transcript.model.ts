import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITranscriptMessage {
    speaker: string; // 'CANDIDATE' | 'AI'
    text: string;
    timestamp: number;
}

export interface IInterviewTranscript extends Document {
    _id: Types.ObjectId;
    interviewId: string;
    messages: ITranscriptMessage[];
    createdAt: Date;
    updatedAt: Date;
}

const TranscriptMessageSchema = new Schema<ITranscriptMessage>({
    speaker: { type: String, required: true },
    text: { type: String, required: true },
    timestamp: { type: Number, required: true }
}, { _id: false });

const InterviewTranscriptSchema = new Schema<IInterviewTranscript>({
    interviewId: { type: String, required: true, index: true },
    messages: [TranscriptMessageSchema]
}, { timestamps: true });

export const InterviewTranscript = mongoose.model<IInterviewTranscript>('InterviewTranscript', InterviewTranscriptSchema);
