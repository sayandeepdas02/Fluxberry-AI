/**
 * AI Interview Types
 */

import { z } from 'zod'
import { AgentType, AISessionStatus } from '../../database/models/index.js'

// ============================================
// REQUEST SCHEMAS
// ============================================

export const startAISessionSchema = z.object({
    agentType: z.enum([
        AgentType.FRONTEND_ENGINEER,
        AgentType.BACKEND_ENGINEER,
        AgentType.FULLSTACK_ENGINEER,
        AgentType.DEVOPS,
        AgentType.QA,
        AgentType.GENERAL,
    ]).optional(),
})

export const endAISessionSchema = z.object({
    sessionId: z.string(),
    reason: z.enum(['COMPLETED', 'TIMEOUT', 'CANDIDATE_EXIT', 'ERROR']),
})

export const saveTranscriptSchema = z.object({
    sessionId: z.string(),
    entries: z.array(z.object({
        speaker: z.enum(['AI', 'CANDIDATE']),
        text: z.string(),
        timestamp: z.number(),
    })),
})

// ============================================
// RESPONSE TYPES
// ============================================

export interface StartAISessionResponse {
    sessionId: string
    ephemeralToken: string
    agentType: string
    systemPrompt: string
    durationSeconds: number
    startedAt: string
    model: string
    voice: string
}

export interface EndAISessionResponse {
    sessionId: string
    status: string
    duration: number
    endedAt: string
}

export interface SaveTranscriptResponse {
    entryCount: number
}

export interface UploadMediaResponse {
    assetId: string
    mediaType: 'AUDIO' | 'VIDEO'
    duration: number | null
    size: number
}

// ============================================
// INPUT TYPES
// ============================================

export type StartAISessionInput = z.infer<typeof startAISessionSchema>
export type EndAISessionInput = z.infer<typeof endAISessionSchema>
export type SaveTranscriptInput = z.infer<typeof saveTranscriptSchema>
