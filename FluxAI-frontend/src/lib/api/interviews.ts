import { apiClient } from './client'
import { ApiResponse } from './types'

export interface IInterview {
    _id: string
    organizationId: string
    candidateId: string
    jobId: string
    start: string // ISO date
    end: string // ISO date
    summary: string
    description?: string
    location?: string
    attendees: { email: string; responseStatus?: string }[]
    status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED'
    googleEventId?: string
    meetLink?: string
    scorecardId?: string
    feedbackSubmitted?: boolean
    createdAt: string
    updatedAt: string
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
    list: (query?: any) =>
        apiClient.get<IInterview[]>('/interviews', query),

    getById: (id: string) =>
        apiClient.get<IInterview>(`/interviews/${id}`),

    create: (data: Partial<IInterview>) =>
        apiClient.post<IInterview>('/interviews', data),

    update: (id: string, data: Partial<IInterview>) =>
        apiClient.patch<IInterview>(`/interviews/${id}`, data),

    cancel: (id: string) =>
        apiClient.post(`/interviews/${id}/cancel`),

    // Scorecards
    getScorecard: (interviewId: string) =>
        apiClient.get<IScorecard>(`/interviews/${interviewId}/scorecard`),

    submitScorecard: (interviewId: string, data: Partial<IScorecard>) =>
        apiClient.post<IScorecard>(`/interviews/${interviewId}/scorecard`, data),
}
