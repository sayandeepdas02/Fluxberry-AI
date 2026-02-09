/**
 * AI Interview Service
 * 
 * Handles AI interview session management, transcript storage, and media handling.
 * V1: OpenAI Realtime API integration with ephemeral token generation.
 */

import OpenAI from 'openai'
import { v4 as uuidv4 } from 'uuid'
import {
    AssessmentAttempt,
    Candidate,
    AISessionStatus,
    AgentType,
    RoundStatus,
    type AgentTypeValue,
    type IAITranscriptEntry,
} from '../../database/models/index.js'
import { getAgentConfig } from './agent-prompts.js'
import type {
    StartAISessionInput,
    EndAISessionInput,
    SaveTranscriptInput,
    StartAISessionResponse,
    EndAISessionResponse,
    SaveTranscriptResponse,
} from './ai-interview.types.js'

class AIInterviewService {
    private _openai: OpenAI | null = null

    private get openai(): OpenAI {
        if (!this._openai) {
            this._openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY,
            })
        }
        return this._openai
    }

    /**
     * Start AI interview session
     * Creates ephemeral token for WebRTC connection
     */
    async startSession(
        attemptId: string,
        input: StartAISessionInput
    ): Promise<StartAISessionResponse> {
        // Find attempt and AI round
        const attempt = await AssessmentAttempt.findById(attemptId)
        if (!attempt) {
            const error = new Error('Attempt not found') as Error & { statusCode: number }
            error.statusCode = 404
            throw error
        }

        // Find AI round
        const aiRoundIndex = attempt.rounds.findIndex(r => r.roundType === 'AI')
        if (aiRoundIndex === -1) {
            const error = new Error('No AI round in this assessment') as Error & { statusCode: number }
            error.statusCode = 400
            throw error
        }

        const aiRound = attempt.rounds[aiRoundIndex]

        // Check if session already in progress (idempotent)
        if (aiRound.aiSessionId && aiRound.aiSessionStatus === AISessionStatus.IN_PROGRESS) {
            // Check if session is stale (> 20 minutes old)
            const sessionAge = aiRound.startedAt
                ? (Date.now() - new Date(aiRound.startedAt).getTime()) / 1000
                : 0
            const MAX_SESSION_DURATION = 20 * 60 // 20 minutes

            if (sessionAge > MAX_SESSION_DURATION) {
                // Auto-expire the stale session
                console.log(`[AI Session] Auto-expiring stale session ${aiRound.aiSessionId} (age: ${Math.floor(sessionAge / 60)}min)`)
                aiRound.aiSessionStatus = AISessionStatus.TIMEOUT
                aiRound.status = RoundStatus.COMPLETED
                aiRound.endedAt = new Date()
                aiRound.aiDurationSeconds = Math.floor(sessionAge)
                await attempt.save()
                // Fall through to create new session
            } else {
                // Return existing session info (reconnection)
                const agentType = (aiRound.agentType || AgentType.GENERAL) as AgentTypeValue
                const config = getAgentConfig(agentType)
                let systemPrompt = config.systemPrompt
                try {
                    const candidate = await Candidate.findById(attempt.candidateId)
                    if (candidate?.firstName) {
                        systemPrompt += `\n\nThe candidate's first name is ${candidate.firstName}. When you greet them, use their name (e.g. "Hey ${candidate.firstName}").`
                    }
                } catch { /* ignore */ }
                const ephemeralToken = await this.createEphemeralToken(config.model, systemPrompt, config.voice)
                return {
                    sessionId: aiRound.aiSessionId,
                    ephemeralToken,
                    agentType: config.agentType,
                    systemPrompt,
                    durationSeconds: config.durationSeconds,
                    startedAt: aiRound.startedAt?.toISOString() || new Date().toISOString(),
                    model: config.model,
                    voice: config.voice,
                }
            }
        }

        // Determine agent type
        const agentType: AgentTypeValue = (input.agentType as AgentTypeValue) || AgentType.GENERAL
        const config = getAgentConfig(agentType)

        // Get candidate name for personalized greeting
        let systemPrompt = config.systemPrompt
        try {
            const candidate = await Candidate.findById(attempt.candidateId)
            if (candidate?.firstName) {
                systemPrompt += `\n\nThe candidate's first name is ${candidate.firstName}. When you greet them, use their name (e.g. "Hey ${candidate.firstName}").`
            }
        } catch {
            // Ignore; use default prompt without name
        }

        // Generate session ID
        const sessionId = `ai_sess_${uuidv4()}`
        const now = new Date()

        // Create ephemeral token from OpenAI Realtime API (with system prompt for session)
        const ephemeralToken = await this.createEphemeralToken(config.model, systemPrompt, config.voice)

        // Update round with session info
        aiRound.aiSessionId = sessionId
        aiRound.aiSessionStatus = AISessionStatus.IN_PROGRESS
        aiRound.agentType = agentType
        aiRound.status = RoundStatus.IN_PROGRESS
        aiRound.startedAt = now
        aiRound.transcript = []

        // Also start the attempt if not started
        if (attempt.status === 'NOT_STARTED') {
            attempt.status = 'IN_PROGRESS'
            attempt.startedAt = now
        }

        await attempt.save()

        return {
            sessionId,
            ephemeralToken,
            agentType: config.agentType,
            systemPrompt,
            durationSeconds: config.durationSeconds,
            startedAt: now.toISOString(),
            model: config.model,
            voice: config.voice,
        }
    }

    /**
     * Create ephemeral client secret for OpenAI Realtime API (WebRTC).
     * Uses POST /v1/realtime/client_secrets per OpenAI docs.
     */
    private async createEphemeralToken(model: string, instructions: string, voice: string): Promise<string> {
        const apiKey = process.env.OPENAI_API_KEY
        if (!apiKey) {
            console.error('OPENAI_API_KEY is not set')
            return ''
        }
        try {
            const response = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    expires_after: { anchor: 'created_at', seconds: 3600 },
                    session: {
                        type: 'realtime',
                        model,
                        instructions,
                        audio: {
                            output: { voice },
                        },
                    },
                }),
            })

            if (!response.ok) {
                const errText = await response.text()
                console.error('OpenAI client_secrets error:', response.status, errText)
                throw new Error(`OpenAI API error: ${response.status} ${errText}`)
            }

            const data = (await response.json()) as { value?: string }
            return data.value ?? ''
        } catch (error) {
            console.error('Failed to create ephemeral token:', error)
            throw error
        }
    }

    /**
     * End AI interview session
     */
    async endSession(
        attemptId: string,
        input: EndAISessionInput
    ): Promise<EndAISessionResponse> {
        const attempt = await AssessmentAttempt.findById(attemptId)
        if (!attempt) {
            const error = new Error('Attempt not found') as Error & { statusCode: number }
            error.statusCode = 404
            throw error
        }

        const aiRound = attempt.rounds.find(r => r.roundType === 'AI')
        if (!aiRound || aiRound.aiSessionId !== input.sessionId) {
            const error = new Error('Invalid session') as Error & { statusCode: number }
            error.statusCode = 400
            throw error
        }

        const now = new Date()
        const startedAt = aiRound.startedAt || now
        const duration = Math.floor((now.getTime() - startedAt.getTime()) / 1000)

        // Map reason to status
        const statusMap: Record<string, typeof AISessionStatus[keyof typeof AISessionStatus]> = {
            'COMPLETED': AISessionStatus.COMPLETED,
            'TIMEOUT': AISessionStatus.TIMEOUT,
            'CANDIDATE_EXIT': AISessionStatus.CANDIDATE_EXIT,
            'ERROR': AISessionStatus.FAILED,
        }

        aiRound.aiSessionStatus = statusMap[input.reason] || AISessionStatus.COMPLETED
        aiRound.status = input.reason === 'COMPLETED' || input.reason === 'TIMEOUT'
            ? RoundStatus.COMPLETED
            : RoundStatus.SKIPPED
        aiRound.endedAt = now
        aiRound.aiDurationSeconds = duration

        await attempt.save()

        return {
            sessionId: input.sessionId,
            status: aiRound.aiSessionStatus,
            duration,
            endedAt: now.toISOString(),
        }
    }

    /**
     * Save transcript entries
     */
    async saveTranscript(
        attemptId: string,
        input: SaveTranscriptInput
    ): Promise<SaveTranscriptResponse> {
        const attempt = await AssessmentAttempt.findById(attemptId)
        if (!attempt) {
            const error = new Error('Attempt not found') as Error & { statusCode: number }
            error.statusCode = 404
            throw error
        }

        const aiRound = attempt.rounds.find(r => r.roundType === 'AI')
        if (!aiRound || aiRound.aiSessionId !== input.sessionId) {
            const error = new Error('Invalid session') as Error & { statusCode: number }
            error.statusCode = 400
            throw error
        }

        // Merge new entries with existing (dedupe by timestamp)
        const existingTimestamps = new Set(
            (aiRound.transcript || []).map(e => e.timestamp)
        )

        // Validate and filter entries: must have text, speaker, and valid timestamp
        const validNewEntries = input.entries.filter(e =>
            e.text &&
            e.text.trim().length > 0 &&
            e.speaker &&
            typeof e.timestamp === 'number' &&
            e.timestamp >= 0 &&
            !existingTimestamps.has(e.timestamp)
        )

        if (!aiRound.transcript) {
            aiRound.transcript = []
        }

        aiRound.transcript.push(...validNewEntries as IAITranscriptEntry[])
        aiRound.transcript.sort((a, b) => a.timestamp - b.timestamp)

        await attempt.save()

        return {
            entryCount: aiRound.transcript.length,
        }
    }

    /**
     * Save media asset reference
     */
    async saveMediaAsset(
        attemptId: string,
        sessionId: string,
        mediaType: 'AUDIO' | 'VIDEO',
        assetId: string
    ): Promise<void> {
        const attempt = await AssessmentAttempt.findById(attemptId)
        if (!attempt) {
            const error = new Error('Attempt not found') as Error & { statusCode: number }
            error.statusCode = 404
            throw error
        }

        const aiRound = attempt.rounds.find(r => r.roundType === 'AI')
        if (!aiRound || aiRound.aiSessionId !== sessionId) {
            const error = new Error('Invalid session') as Error & { statusCode: number }
            error.statusCode = 400
            throw error
        }

        if (!aiRound.aiMediaAssets) {
            aiRound.aiMediaAssets = {}
        }

        if (mediaType === 'AUDIO') {
            aiRound.aiMediaAssets.audioAssetId = assetId
        } else {
            aiRound.aiMediaAssets.videoAssetId = assetId
        }

        await attempt.save()
    }

    /**
     * Get AI interview session details (for recruiter dashboard)
     */
    async getSessionDetails(attemptId: string) {
        const attempt = await AssessmentAttempt.findById(attemptId)
        if (!attempt) {
            return null
        }

        const aiRound = attempt.rounds.find(r => r.roundType === 'AI')
        if (!aiRound) {
            return null
        }

        return {
            sessionId: aiRound.aiSessionId,
            status: aiRound.aiSessionStatus,
            agentType: aiRound.agentType,
            transcript: aiRound.transcript || [],
            mediaAssets: aiRound.aiMediaAssets,
            duration: aiRound.aiDurationSeconds,
            startedAt: aiRound.startedAt,
            endedAt: aiRound.endedAt,
        }
    }
}

export const aiInterviewService = new AIInterviewService()
