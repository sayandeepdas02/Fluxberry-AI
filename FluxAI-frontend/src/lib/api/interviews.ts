import { apiClient } from './client'
import { ApiResponse } from './types'

export type InterviewType = 'SCREENING' | 'TECHNICAL' | 'BEHAVIORAL' | 'SYSTEM_DESIGN' | 'FINAL'
export type InterviewStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED' | 'NO_SHOW'

// Sub-types always present after backend populate (list + getById always populate)
export interface PopulatedPerson {
    _id: string
    firstName?: string
    lastName?: string
    email: string
}

export interface PopulatedJob {
    _id: string
    title: string
}

// API response shape — candidateId / interviewerId / jobId are always populated objects
export interface IInterview {
    _id: string
    organizationId: string
    candidateId: PopulatedPerson
    interviewerId: PopulatedPerson
    jobId: PopulatedJob
    applicationId: string
    stageId?: string
    attendees?: string[]
    title: string
    description?: string
    type: InterviewType
    status: InterviewStatus
    startTime: string
    endTime: string
    meetingLink?: string
    location?: string
    calendarEventId?: string
    feedbackSubmitted: boolean
    scorecardId?: string
    createdAt: string
    updatedAt: string
}

// Form state for create/edit — IDs are plain strings, not populated objects
export interface InterviewFormData {
    candidateId?: string
    interviewerId?: string
    jobId?: string
    applicationId?: string
    title?: string
    description?: string
    type?: InterviewType
    status?: InterviewStatus
    startTime?: string
    endTime?: string
    meetingLink?: string
    location?: string
    attendees?: string[]
}

export interface CreateInterviewInput {
    candidateId: string
    interviewerId: string
    jobId: string
    applicationId: string
    stageId?: string
    attendees?: string[]
    title: string
    description?: string
    type: InterviewType
    startTime: string
    endTime: string
    meetingLink?: string
    location?: string
}

export interface IScorecard {
    _id: string
    interviewId: string
    interviewerId: string
    candidateId: string
    overallRating: number
    recommendation: 'STRONG_HIRE' | 'HIRE' | 'NO_HIRE' | 'STRONG_NO_HIRE'
    sections: {
        name: string
        rating: number
        feedback: string
    }[]
    privateNotes?: string
    createdAt: string
    updatedAt: string
}

export const interviewsApi = {
    list: (query?: Record<string, string>) =>
        apiClient.get<IInterview[]>('/interviews', query),

    getById: (id: string) =>
        apiClient.get<IInterview>(`/interviews/${id}`),

    create: (data: CreateInterviewInput) =>
        apiClient.post<IInterview>('/interviews', data),

    update: (id: string, data: Partial<CreateInterviewInput>) =>
        apiClient.patch<IInterview>(`/interviews/${id}`, data),

    cancel: (id: string) =>
        apiClient.delete<IInterview>(`/interviews/${id}`),

    // Scorecards
    getScorecard: (interviewId: string) =>
        apiClient.get<IScorecard>(`/interviews/${interviewId}/scorecard`),

    submitScorecard: (interviewId: string, data: Partial<IScorecard>) =>
        apiClient.post<IScorecard>(`/interviews/scorecards`, { ...data, interviewId }),
}
