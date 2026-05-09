"use client"

/**
 * useInterviewSocket — Socket.IO client for the AI Voice Interview
 *
 * Manages the full Socket.IO lifecycle for a single interview session:
 * - Connects to backend /ai-interview namespace
 * - Sends audio_chunk events from mic MediaRecorder
 * - Sends candidate_answer_complete on silence detection
 * - Receives transcript_chunk, ai_question, session_state, stt_error events
 * - Handles STT failure fallback to manual text input
 */

import { useEffect, useRef, useCallback, useState } from "react"
import { io, Socket } from "socket.io-client"
import { getStoredToken } from "@/lib/api/client"

const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'
const BACKEND_WS = process.env.NEXT_PUBLIC_BACKEND_WS || NEXT_PUBLIC_API_URL.replace('/api', '')

export type InterviewPhase =
    | "INTRO"
    | "PROJECT_DEEP_DIVE"
    | "FUNDAMENTALS"
    | "CULTURE_FIT"
    | "SUMMARY"
    | "COMPLETED"

export interface TranscriptEntry {
    speaker: "AI" | "CANDIDATE"
    text: string
    timestamp: Date
    isPartial?: boolean
}

export interface AIQuestion {
    text: string
    audioBase64: string
    phase: InterviewPhase
    isComplete: boolean
}

interface UseInterviewSocketOptions {
    sessionId: string | null
    attemptId: string
    enabled: boolean
    onAIQuestion: (q: AIQuestion) => void
    onSessionState: (state: { currentPhase: InterviewPhase; lastAIMessage: string }) => void
    onTranscriptChunk: (entry: TranscriptEntry) => void
    onComplete: () => void
    onError: (msg: string) => void
}

interface UseInterviewSocketReturn {
    connected: boolean
    sttFailed: boolean
    sendAudioChunk: (data: ArrayBuffer) => void
    sendSilenceDetected: (accumulatedText: string) => void
    sendManualAnswer: (text: string) => void
    disconnect: () => void
}

export function useInterviewSocket({
    sessionId,
    attemptId,
    enabled,
    onAIQuestion,
    onSessionState,
    onTranscriptChunk,
    onComplete,
    onError,
}: UseInterviewSocketOptions): UseInterviewSocketReturn {
    const socketRef = useRef<Socket | null>(null)
    const [connected, setConnected] = useState(false)
    const [sttFailed, setSttFailed] = useState(false)

    // Stable refs to avoid stale closures in event handlers
    const onAIQuestionRef = useRef(onAIQuestion)
    const onSessionStateRef = useRef(onSessionState)
    const onTranscriptChunkRef = useRef(onTranscriptChunk)
    const onCompleteRef = useRef(onComplete)
    const onErrorRef = useRef(onError)

    useEffect(() => { onAIQuestionRef.current = onAIQuestion }, [onAIQuestion])
    useEffect(() => { onSessionStateRef.current = onSessionState }, [onSessionState])
    useEffect(() => { onTranscriptChunkRef.current = onTranscriptChunk }, [onTranscriptChunk])
    useEffect(() => { onCompleteRef.current = onComplete }, [onComplete])
    useEffect(() => { onErrorRef.current = onError }, [onError])

    useEffect(() => {
        if (!sessionId || !enabled) return

        const socket = io(`${BACKEND_WS}/ai-interview`, {
            transports: ["websocket", "polling"],
            withCredentials: true,
            auth: { token: getStoredToken() || '' },
        })

        socketRef.current = socket

        socket.on("connect", () => {
            setConnected(true)
            // Join the session immediately after connecting
            socket.emit("join_session", { sessionId, attemptId })
        })

        socket.on("disconnect", (reason) => {
            setConnected(false)
            // Transport close is expected on cleanup — don't surface as error
            if (reason !== "io client disconnect") {
                console.warn("[Socket] Disconnected:", reason)
            }
        })

        // Issue 11 fix: surface auth failures and network errors
        socket.on("connect_error", (err) => {
            console.error("[Socket] Connection error:", err.message)
            const isAuthError = err.message?.includes("UNAUTHORIZED")
            onErrorRef.current(
                isAuthError
                    ? "Authentication failed. Please sign in again."
                    : `Connection failed: ${err.message}`
            )
        })

        const onReconnectFailed = () => {
            onErrorRef.current("Unable to reconnect to interview server. Please refresh the page.")
        }
        socket.io.on("reconnect_failed", onReconnectFailed)

        socket.on("session_state", (state) => {
            onSessionStateRef.current({
                currentPhase: state.currentPhase,
                lastAIMessage: state.lastAIMessage,
            })
        })

        socket.on("transcript_chunk", (chunk: { textChunk: string; isFinal: boolean; confidence: number }) => {
            onTranscriptChunkRef.current({
                speaker: "CANDIDATE",
                text: chunk.textChunk,
                timestamp: new Date(),
                isPartial: !chunk.isFinal,
            })
        })

        socket.on("ai_question", (q: AIQuestion) => {
            onAIQuestionRef.current(q)
            onTranscriptChunkRef.current({
                speaker: "AI",
                text: q.text,
                timestamp: new Date(),
            })
            if (q.isComplete) {
                onCompleteRef.current()
            }
        })

        socket.on("stt_error", (payload: { sessionId: string; message: string; canRetry: boolean }) => {
            console.warn("[Socket] STT error:", payload.message)
            if (!payload.canRetry) {
                setSttFailed(true)
            }
            onErrorRef.current(payload.message)
        })

        socket.on("tts_error", () => {
            // Non-fatal — text is still displayed; audio just won't play
            console.warn("[Socket] TTS error — text-only mode")
        })

        socket.on("error", (payload: { code: string; message: string }) => {
            onErrorRef.current(payload.message)
        })

        return () => {
            socket.io.off("reconnect_failed", onReconnectFailed)
            socket.emit("leave_session", { sessionId })
            socket.disconnect()
            socketRef.current = null
            setConnected(false)
        }
    }, [sessionId, attemptId, enabled])

    const sendAudioChunk = useCallback((data: ArrayBuffer) => {
        if (!socketRef.current?.connected || !sessionId) return
        socketRef.current.emit("audio_chunk", data, sessionId)
    }, [sessionId])

    const sendSilenceDetected = useCallback((accumulatedText: string) => {
        if (!socketRef.current?.connected || !sessionId) return
        socketRef.current.emit("candidate_answer_complete", { sessionId, accumulatedText })
    }, [sessionId])

    const sendManualAnswer = useCallback((text: string) => {
        if (!socketRef.current?.connected || !sessionId) return
        socketRef.current.emit("candidate_answer_manual", { sessionId, text })
    }, [sessionId])

    const disconnect = useCallback(() => {
        if (socketRef.current) {
            sessionId && socketRef.current.emit("leave_session", { sessionId })
            socketRef.current.disconnect()
        }
    }, [sessionId])

    return { connected, sttFailed, sendAudioChunk, sendSilenceDetected, sendManualAnswer, disconnect }
}
