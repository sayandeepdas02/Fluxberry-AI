/**
 * AI Interview Types — V2 (Async Recording + Processing)
 */

import { z } from 'zod'
import { AgentType } from '../../database/models/index.js'

// ============================================
// REQUEST SCHEMAS
// ============================================

export const startAISessionSchema = z.object({
    agentType: z.enum([
        AgentType.FRONTEND_ENGINEER,
        AgentType.BACKEND_ENGINEER,
        AgentType.HR_GENERAL,
    ]).optional(),
})

export const endAISessionSchema = z.object({
    sessionId: z.string(),
    reason: z.enum(['COMPLETED', 'TIMEOUT', 'CANDIDATE_EXIT', 'ERROR']),
})

export const initUploadSchema = z.object({
    sessionId: z.string(),
    questionId: z.string(),
    mimeType: z.string().default('video/webm'),
    durationSeconds: z.number().min(0).default(0),
})

export const completeUploadSchema = z.object({
    sessionId: z.string(),
    questionId: z.string(),
    durationSeconds: z.number().min(0),
    size: z.number().min(0).optional(),
})

export const completeSessionSchema = z.object({
    sessionId: z.string(),
})

// ============================================
// RESPONSE TYPES
// ============================================

export interface AIQuestionConfig {
    id: string
    text: string
    prepSeconds: number
    answerSeconds: number
}

export interface StartAISessionResponse {
    sessionId: string
    questions: AIQuestionConfig[]
    consentRecordedAt: string
    totalDurationEstimate: number
}

export interface InitUploadResponse {
    uploadUrl: string
    uploadId: string
    storageKey: string
    expiresIn: number
}

export interface CompleteUploadResponse {
    questionId: string
    status: string
}

export interface CompleteSessionResponse {
    sessionId: string
    status: string
    totalResponses: number
}

export interface EndAISessionResponse {
    sessionId: string
    status: string
    duration: number
    endedAt: string
}

export interface AIResponseResult {
    questionId: string
    questionText: string
    questionIndex: number
    durationSeconds: number
    status: string
    transcript: string | null
    analysis: {
        summary: string[]
        keyPoints: string[]
        skillsObserved: string[]
        relevance: string
    } | null
}

export interface AIInterviewResultsResponse {
    sessionId: string
    status: string
    synthesis: {
        overallSummary: string
        strengths: string[]
        gaps: string[]
        suggestedFollowUps: string[]
    } | null
    responses: AIResponseResult[]
    consent: { recordedAt: string } | null
    aiDisclosure: string
}

// ============================================
// INPUT TYPES
// ============================================

export type StartAISessionInput = z.infer<typeof startAISessionSchema>
export type EndAISessionInput = z.infer<typeof endAISessionSchema>
export type InitUploadInput = z.infer<typeof initUploadSchema>
export type CompleteUploadInput = z.infer<typeof completeUploadSchema>
export type CompleteSessionInput = z.infer<typeof completeSessionSchema>
