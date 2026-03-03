/**
 * AI Interview WebSocket Gateway
 *
 * Socket.IO gateway for the real-time voice interview.
 * Manages per-session state: STT connections, transcript accumulation, TTS delivery.
 *
 * Events received from client:
 *   join_session       { sessionId, attemptId, identity? }
 *   audio_chunk        ArrayBuffer — raw PCM/WebM mic data from LiveKit track
 *   candidate_answer_complete  { sessionId, accumulatedText }  — sent by 5s silence gate
 *   candidate_answer_manual    { sessionId, text }             — fallback manual input
 *   leave_session      { sessionId }
 *
 * Events emitted to client:
 *   session_state      { sessionId, currentPhase, questionIndex, lastAIMessage }
 *   transcript_chunk   { sessionId, textChunk, isFinal, confidence }
 *   ai_question        { text, audioBase64, phase, isComplete }
 *   stt_error          { sessionId, message, canRetry }
 *   tts_error          { sessionId, message }
 *   error              { code, message }
 */

import type { Server as SocketIOServer, Socket } from 'socket.io'
import jwt from 'jsonwebtoken'
import { createSTTConnection, type STTConnection } from './services/stt.service.js'
import { textToSpeech } from './services/tts.service.js'
import { interviewOrchestrator } from './services/interviewOrchestrator.js'

// ─── Per-session gateway state ────────────────────────────────────────────────

interface SessionState {
    sessionId: string
    socket: Socket
    sttConnection: STTConnection | null
    sttRetryCount: number
    accumulatedText: string   // text accumulated between silence boundaries
    isProcessingTurn: boolean // lock to prevent double-processing
}

// Map sessionId → state (cleared on disconnect/complete)
const sessions = new Map<string, SessionState>()

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function deliverAIQuestion(
    state: SessionState,
    text: string,
    phase: string,
    isComplete: boolean
): Promise<void> {
    // Generate TTS audio
    let audioBase64 = ''
    try {
        const audioBuf = await textToSpeech(text)
        if (audioBuf.length > 0) {
            audioBase64 = audioBuf.toString('base64')
        }
    } catch (err) {
        console.error(`[Gateway] TTS failed for session=${state.sessionId}:`, err)
        state.socket.emit('tts_error', {
            sessionId: state.sessionId,
            message: 'Voice generation failed — text question displayed instead',
        })
    }

    state.socket.emit('ai_question', {
        text,
        audioBase64,
        phase,
        isComplete,
    })
}

async function handleSTTError(state: SessionState, err: Error): Promise<void> {
    console.error(`[Gateway] STT error session=${state.sessionId}:`, err.message)

    if (state.sttRetryCount < 1) {
        // Retry once
        state.sttRetryCount += 1
        state.socket.emit('stt_error', {
            sessionId: state.sessionId,
            message: 'Speech recognition error — retrying…',
            canRetry: true,
        })

        try {
            state.sttConnection?.close()
            state.sttConnection = await createSTTConnection(
                state.sessionId,
                state.socket,
                (text) => { state.accumulatedText += ' ' + text },
                (retryErr) => handleSTTError(state, retryErr)
            )
        } catch {
            // Retry itself failed — fall through to manual input
        }
    } else {
        // Exhausted retries — enable manual text input fallback
        state.sttConnection?.close()
        state.sttConnection = null
        state.socket.emit('stt_error', {
            sessionId: state.sessionId,
            message: 'Speech recognition unavailable. Please type your answers instead.',
            canRetry: false,  // triggers ManualTextInput UI in frontend
        })
    }
}

async function processCandidateTurn(state: SessionState, answerText: string): Promise<void> {
    if (state.isProcessingTurn || !answerText.trim()) return
    state.isProcessingTurn = true
    state.accumulatedText = ''

    try {
        const result = await interviewOrchestrator.submitTurn(state.sessionId, answerText.trim())

        await deliverAIQuestion(
            state,
            result.nextMessage,
            result.currentPhase,
            result.isComplete
        )

        if (result.isComplete) {
            // Clean up session state
            sessions.delete(state.sessionId)
            state.sttConnection?.close()
        }
    } catch (err: any) {
        console.error(`[Gateway] Orchestrator error session=${state.sessionId}:`, err)
        state.socket.emit('error', {
            code: err.code ?? 'ORCHESTRATOR_ERROR',
            message: err.message ?? 'Failed to process your answer',
        })
    } finally {
        state.isProcessingTurn = false
    }
}

// ─── Gateway entry point ──────────────────────────────────────────────────────

export function createGateway(io: SocketIOServer): void {
    const nsp = io.of('/ai-interview')

    // ── JWT auth middleware ──────────────────────────────────────────────
    // Client must pass: socket.auth = { token: 'Bearer <jwt>' }  OR  just { token: '<jwt>' }
    nsp.use((socket, next) => {
        try {
            const raw: unknown = (socket.handshake.auth as any)?.token
                ?? (socket.handshake.headers as any)?.authorization
            if (!raw || typeof raw !== 'string') {
                return next(new Error('UNAUTHORIZED: missing token'))
            }
            const token = raw.startsWith('Bearer ') ? raw.slice(7) : raw
            const secret = process.env.JWT_SECRET
            if (!secret) return next(new Error('SERVER_ERROR: JWT secret not configured'))
            jwt.verify(token, secret)  // throws on invalid/expired
            next()
        } catch {
            next(new Error('UNAUTHORIZED: invalid or expired token'))
        }
    })

    nsp.on('connection', (socket: Socket) => {
        console.log(`[Gateway] Client connected: ${socket.id}`)

        // ── join_session ────────────────────────────────────────────────────
        socket.on('join_session', async (payload: { sessionId: string; attemptId: string; identity?: string }) => {
            const { sessionId } = payload

            if (!sessionId) {
                socket.emit('error', { code: 'MISSING_SESSION_ID', message: 'sessionId is required' })
                return
            }

            console.log(`[Gateway] join_session: sessionId=${sessionId} socketId=${socket.id}`)

            // Get current orchestrator state to send to frontend
            let sessionState
            try {
                sessionState = await interviewOrchestrator.getSessionState(sessionId)
            } catch (err: any) {
                socket.emit('error', { code: 'SESSION_NOT_FOUND', message: err.message })
                return
            }

            // Create Deepgram STT connection
            let sttConnection: STTConnection | null = null
            try {
                sttConnection = await createSTTConnection(
                    sessionId,
                    socket,
                    (text: string) => {
                        const st = sessions.get(sessionId)
                        if (st) st.accumulatedText += ' ' + text
                    },
                    (err: Error) => {
                        const st = sessions.get(sessionId)
                        if (st) handleSTTError(st, err)
                    }
                )
            } catch (err) {
                console.error('[Gateway] Failed to create STT connection:', err)
            }

            const state: SessionState = {
                sessionId,
                socket,
                sttConnection,
                sttRetryCount: 0,
                accumulatedText: '',
                isProcessingTurn: false,
            }
            sessions.set(sessionId, state)

            // Send current session state (reconnection support)
            socket.emit('session_state', {
                sessionId,
                currentPhase: sessionState.currentPhase,
                questionIndex: sessionState.questionIndex,
                lastAIMessage: sessionState.lastAIMessage,
                transcript: sessionState.transcript.slice(-10), // last 10 for reconnection
            })
        })

        // ── audio_chunk ─────────────────────────────────────────────────────
        // Receives raw audio from the browser's MediaRecorder / LiveKit mic track.
        // Forwards to Deepgram STT for real-time transcription.
        socket.on('audio_chunk', (data: ArrayBuffer, sessionId: string) => {
            const state = sessions.get(sessionId)
            if (!state?.sttConnection) return
            state.sttConnection.sendAudio(data)
        })

        // ── candidate_answer_complete ───────────────────────────────────────
        // Emitted by the 5-second silence gate in the frontend.
        // Includes the full accumulated text from Deepgram interim results.
        socket.on('candidate_answer_complete', async (payload: { sessionId: string; accumulatedText: string }) => {
            const state = sessions.get(payload.sessionId)
            if (!state) return

            // Use the text sent by the client (accumulated from transcript_chunk events)
            // OR fall back to server-side accumulated text from Deepgram finals
            const answerText = payload.accumulatedText.trim() || state.accumulatedText.trim()
            await processCandidateTurn(state, answerText)
        })

        // ── candidate_answer_manual ─────────────────────────────────────────
        // STT fallback: user typed their answer manually.
        socket.on('candidate_answer_manual', async (payload: { sessionId: string; text: string }) => {
            const state = sessions.get(payload.sessionId)
            if (!state) return
            await processCandidateTurn(state, payload.text)
        })

        // ── leave_session ───────────────────────────────────────────────────
        socket.on('leave_session', (payload: { sessionId: string }) => {
            const state = sessions.get(payload.sessionId)
            if (state) {
                state.sttConnection?.close()
                sessions.delete(payload.sessionId)
            }
        })

        // ── disconnect ──────────────────────────────────────────────────────
        socket.on('disconnect', () => {
            console.log(`[Gateway] Client disconnected: ${socket.id}`)
            // Find and clean up any sessions associated with this socket
            for (const [sessionId, state] of sessions.entries()) {
                if (state.socket.id === socket.id) {
                    state.sttConnection?.close()
                    sessions.delete(sessionId)
                    console.log(`[Gateway] Cleaned up session=${sessionId}`)
                }
            }
        })
    })

    console.log('🎙️  AI Interview Gateway initialized at /ai-interview')
}
