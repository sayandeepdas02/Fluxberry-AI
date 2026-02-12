import mongoose, { Schema, Document, Types } from 'mongoose'

export const InterviewType = {
    SCREENING: 'SCREENING',
    TECHNICAL: 'TECHNICAL',
    BEHAVIORAL: 'BEHAVIORAL',
    SYSTEM_DESIGN: 'SYSTEM_DESIGN',
    FINAL: 'FINAL',
} as const
export type InterviewTypeValue = typeof InterviewType[keyof typeof InterviewType]

export const InterviewStatus = {
    SCHEDULED: 'SCHEDULED',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
    RESCHEDULED: 'RESCHEDULED',
    NO_SHOW: 'NO_SHOW',
} as const
export type InterviewStatusType = typeof InterviewStatus[keyof typeof InterviewStatus]

export interface IInterview extends Document {
    _id: Types.ObjectId
    organizationId: Types.ObjectId
    jobId: Types.ObjectId
    candidateId: Types.ObjectId
    applicationId: Types.ObjectId
    stageId?: Types.ObjectId
    interviewerId: Types.ObjectId // Primary interviewer
    attendees: Types.ObjectId[] // Additional interviewers
    title: string
    description?: string
    type: InterviewTypeValue
    status: InterviewStatusType
    startTime: Date
    endTime: Date
    meetingLink?: string // Google Meet / Zoom
    location?: string
    calendarEventId?: string // Google Calendar Event ID
    feedbackSubmitted: boolean
    scorecardId?: Types.ObjectId // Link to submitted scorecard
    createdAt: Date
    updatedAt: Date
}

const InterviewSchema = new Schema<IInterview>({
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
    candidateId: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true, index: true },
    applicationId: { type: Schema.Types.ObjectId, ref: 'JobApplication', required: true },
    stageId: { type: Schema.Types.ObjectId, ref: 'PipelineStage' },
    interviewerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    attendees: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    title: { type: String, required: true },
    description: { type: String },
    type: { type: String, enum: Object.values(InterviewType), required: true },
    status: { type: String, enum: Object.values(InterviewStatus), default: InterviewStatus.SCHEDULED, index: true },
    startTime: { type: Date, required: true, index: true },
    endTime: { type: Date, required: true },
    meetingLink: { type: String },
    location: { type: String },
    calendarEventId: { type: String },
    feedbackSubmitted: { type: Boolean, default: false },
    scorecardId: { type: Schema.Types.ObjectId, ref: 'Scorecard' },
}, { timestamps: true })

InterviewSchema.index({ interviewerId: 1, startTime: 1 })
InterviewSchema.index({ organizationId: 1, startTime: 1 })

export const Interview = mongoose.model<IInterview>('Interview', InterviewSchema)
