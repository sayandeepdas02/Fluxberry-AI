"use client"

/**
 * AIInterviewRoom — Real-time AI Voice Interview
 *
 * Replaces RibbonAIInterviewGate for AI rounds.
 * Uses: LiveKit (WebRTC mic), Deepgram (STT via backend), ElevenLabs (TTS via backend).
 *
 * Flow:
 * 1. Candidate provides mic permission
 * 2. Backend creates orchestrator session + returns sessionId
 * 3. Component connects Socket.IO → receives first AI question
 * 4. MediaRecorder streams mic audio → backend → Deepgram → transcript_chunk events
 * 5. 5-second silence detection → candidateAnswerComplete → next AI question
 * 6. AI audio (base64) is played via HTMLAudioElement
 * 7. On complete signal → onComplete() prop called
 */

import { useState, useEffect, useRef, useCallback } from "react"
import { Mic, MicOff, Loader2, AlertCircle, Volume2, SendHorizontal, CheckCircle } from "lucide-react"
import { useSilenceDetection } from "../../hooks/useSilenceDetection"
import { useInterviewSocket, type TranscriptEntry, type InterviewPhase, type AIQuestion } from "../../hooks/useInterviewSocket"

const PHASE_LABELS: Record<InterviewPhase, string> = {
    INTRO: "Introduction",
    PROJECT_DEEP_DIVE: "Projects",
    FUNDAMENTALS: "Technical",
    CULTURE_FIT: "Culture",
    SUMMARY: "Wrap-Up",
    COMPLETED: "Completed",
}

const PHASE_ORDER: InterviewPhase[] = ["INTRO", "PROJECT_DEEP_DIVE", "FUNDAMENTALS", "CULTURE_FIT", "SUMMARY"]

interface AIInterviewRoomProps {
    attemptId: string
    assessmentId: string
    onComplete: () => void
}

// ── Session creation step ─────────────────────────────────────────────────────

const BACKEND_API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"

async function createOrchestratorSession(attemptId: string): Promise<string> {
    const res = await fetch(`${BACKEND_API}/api/ai-interview/orchestrator/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ attemptId }),
    })
    const body = await res.json()
    if (!res.ok || !body.success) throw new Error(body.error?.message ?? "Failed to create session")
    return body.data.sessionId as string
}

// ── Audio playback ────────────────────────────────────────────────────────────

function playAudioBase64(base64: string): HTMLAudioElement | null {
    if (!base64) return null
    const audio = new Audio(`data:audio/mp3;base64,${base64}`)
    audio.play().catch(console.error)
    return audio
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AIInterviewRoom({ attemptId, onComplete }: AIInterviewRoomProps) {
    // Setup state
    const [setupStage, setSetupStage] = useState<"idle" | "requesting-mic" | "creating-session" | "ready" | "error">("idle")
    const [errorMsg, setErrorMsg] = useState<string | null>(null)

    // Session state
    const [sessionId, setSessionId] = useState<string | null>(null)
    const [micStream, setMicStream] = useState<MediaStream | null>(null)

    // Interview state
    const [currentPhase, setCurrentPhase] = useState<InterviewPhase>("INTRO")
    const [currentQuestion, setCurrentQuestion] = useState<string>("Welcome! When you're ready, click Start Interview.")
    const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
    const [isAISpeaking, setIsAISpeaking] = useState(false)
    const [partialText, setPartialText] = useState("")

    // Manual input fallback
    const [manualText, setManualText] = useState("")
    const [isComplete, setIsComplete] = useState(false)

    // Refs
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const transcriptEndRef = useRef<HTMLDivElement | null>(null)
    const accumulatedTranscriptRef = useRef("")

    // ── Socket ────────────────────────────────────────────────────────────────

    const handleAIQuestion = useCallback((q: AIQuestion) => {
        setIsAISpeaking(true)
        setCurrentPhase(q.phase)
        setCurrentQuestion(q.text)

        // Play TTS audio
        if (q.audioBase64) {
            if (audioRef.current) audioRef.current.pause()
            const audio = playAudioBase64(q.audioBase64)
            if (audio) {
                audioRef.current = audio
                audio.addEventListener("ended", () => setIsAISpeaking(false))
            } else {
                setIsAISpeaking(false)
            }
        } else {
            setIsAISpeaking(false)
        }

        if (q.isComplete) {
            setIsComplete(true)
        }
    }, [])

    const handleSessionState = useCallback((state: { currentPhase: InterviewPhase; lastAIMessage: string }) => {
        setCurrentPhase(state.currentPhase)
        if (state.lastAIMessage) setCurrentQuestion(state.lastAIMessage)
    }, [])

    const handleTranscriptChunk = useCallback((entry: TranscriptEntry) => {
        if (entry.isPartial) {
            setPartialText(entry.text)
            // Accumulate for silence trigger
            accumulatedTranscriptRef.current = entry.text
        } else {
            setPartialText("")
            setTranscript(prev => {
                // Replace last partial candidate entry or append
                const last = prev[prev.length - 1]
                if (last?.speaker === "CANDIDATE" && last.isPartial) {
                    return [...prev.slice(0, -1), { ...entry, isPartial: false }]
                }
                return [...prev, entry]
            })
        }
    }, [])

    const handleError = useCallback((msg: string) => {
        setErrorMsg(msg)
    }, [])

    const { connected, sttFailed, sendAudioChunk, sendSilenceDetected, sendManualAnswer } = useInterviewSocket({
        sessionId,
        attemptId,
        enabled: setupStage === "ready",
        onAIQuestion: handleAIQuestion,
        onSessionState: handleSessionState,
        onTranscriptChunk: handleTranscriptChunk,
        onComplete: () => { setIsComplete(true) },
        onError: handleError,
    })

    // ── Silence detection ─────────────────────────────────────────────────────

    const handleSilenceDetected = useCallback(() => {
        if (!sessionId || isAISpeaking || isComplete) return
        const accumulated = accumulatedTranscriptRef.current.trim()
        if (!accumulated) return
        accumulatedTranscriptRef.current = ""
        setPartialText("")
        sendSilenceDetected(accumulated)
    }, [sessionId, isAISpeaking, isComplete, sendSilenceDetected])

    useSilenceDetection({
        stream: micStream,
        enabled: setupStage === "ready" && !isAISpeaking && !isComplete && !sttFailed,
        onSilenceDetected: handleSilenceDetected,
    })

    // ── MediaRecorder → audio_chunk stream ───────────────────────────────────

    useEffect(() => {
        if (!micStream || setupStage !== "ready") return

        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
            ? "audio/webm;codecs=opus"
            : "audio/webm"

        const recorder = new MediaRecorder(micStream, { mimeType })
        recorder.ondataavailable = async (e) => {
            if (e.data.size > 0) {
                const buffer = await e.data.arrayBuffer()
                sendAudioChunk(buffer)
            }
        }
        recorder.start(250) // send 250ms chunks
        mediaRecorderRef.current = recorder

        return () => {
            recorder.stop()
            mediaRecorderRef.current = null
        }
    }, [micStream, setupStage, sendAudioChunk])

    // ── Auto-scroll transcript ────────────────────────────────────────────────

    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [transcript, partialText])

    // ── Complete → notify parent ──────────────────────────────────────────────

    useEffect(() => {
        if (isComplete) {
            const t = setTimeout(onComplete, 3500)
            return () => clearTimeout(t)
        }
    }, [isComplete, onComplete])

    // ── Setup: mic → session ──────────────────────────────────────────────────

    const handleStart = async () => {
        setErrorMsg(null)
        setSetupStage("requesting-mic")

        let stream: MediaStream
        try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
            setMicStream(stream)
        } catch {
            setErrorMsg("Microphone permission denied. Please allow mic access and try again.")
            setSetupStage("error")
            return
        }

        setSetupStage("creating-session")
        try {
            const sid = await createOrchestratorSession(attemptId)
            setSessionId(sid)
            setSetupStage("ready")
        } catch (e: any) {
            setErrorMsg(e.message ?? "Failed to start interview session")
            setSetupStage("error")
            stream.getTracks().forEach(t => t.stop())
        }
    }

    // ── Manual submit ─────────────────────────────────────────────────────────

    const handleManualSubmit = () => {
        const text = manualText.trim()
        if (!text) return
        sendManualAnswer(text)
        setManualText("")
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────

    // ── Setup / idle screen ───────────────────────────────────────────────────
    if (setupStage === "idle" || setupStage === "error") {
        return (
            <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6">
                <div className="w-full max-w-lg space-y-8">
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto">
                            <Mic className="w-8 h-8 text-orange-500" />
                        </div>
                        <h1 className="text-2xl font-bold">AI Voice Interview</h1>
                        <p className="text-neutral-400 leading-relaxed text-sm">
                            You'll have a live voice conversation with an AI interviewer. Speak naturally —
                            a 5-second pause will be taken as your answer complete signal.
                            Ensure your microphone is working before starting.
                        </p>
                    </div>

                    {errorMsg && (
                        <div className="flex items-start gap-3 text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                            <p className="text-sm">{errorMsg}</p>
                        </div>
                    )}

                    <button
                        onClick={handleStart}
                        className="w-full py-3.5 px-6 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-orange-900/30"
                    >
                        <Mic className="w-5 h-5" />
                        Start AI Interview
                    </button>
                </div>
            </div>
        )
    }

    // ── Loading screen ────────────────────────────────────────────────────────
    if (setupStage === "requesting-mic" || setupStage === "creating-session") {
        return (
            <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
                <div className="text-center space-y-4">
                    <Loader2 className="w-10 h-10 text-orange-500 animate-spin mx-auto" />
                    <p className="text-neutral-400">
                        {setupStage === "requesting-mic" ? "Requesting microphone access…" : "Setting up your interview session…"}
                    </p>
                </div>
            </div>
        )
    }

    // ── Interview room ────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-neutral-950 text-white flex flex-col">

            {/* ── Phase indicator ─────────────────────────────────────────── */}
            <div className="border-b border-neutral-800 px-6 py-3">
                <div className="flex items-center gap-1 max-w-4xl mx-auto">
                    {PHASE_ORDER.map((phase, i) => {
                        const currentIdx = PHASE_ORDER.indexOf(currentPhase)
                        const isDone = i < currentIdx
                        const isCurrent = i === currentIdx
                        return (
                            <div key={phase} className="flex items-center gap-1">
                                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all
                                    ${isCurrent ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" :
                                        isDone ? "text-neutral-500" : "text-neutral-700"}`}>
                                    {isDone && <CheckCircle className="w-3 h-3" />}
                                    {PHASE_LABELS[phase]}
                                </div>
                                {i < PHASE_ORDER.length - 1 && (
                                    <div className="w-4 h-px bg-neutral-800" />
                                )}
                            </div>
                        )
                    })}

                    {/* Connection status */}
                    <div className="ml-auto flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${connected ? "bg-green-500 animate-pulse" : "bg-neutral-600"}`} />
                        <span className="text-xs text-neutral-500">{connected ? "Live" : "Connecting…"}</span>
                    </div>
                </div>
            </div>

            {/* ── Main content ────────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-6 py-8 gap-6">

                {/* Current AI question */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-3">
                    <div className="flex items-center gap-2 text-xs text-neutral-500 font-medium tracking-wide uppercase">
                        <Volume2 className={`w-3.5 h-3.5 ${isAISpeaking ? "text-orange-400 animate-pulse" : "text-neutral-600"}`} />
                        {isAISpeaking ? "Speaking…" : "AI Interviewer"}
                    </div>
                    <p className="text-lg font-medium leading-relaxed text-neutral-100">
                        {isComplete ? "Thank you for completing the interview! Your responses are being evaluated." : currentQuestion}
                    </p>
                </div>

                {/* Mic status */}
                {!isComplete && (
                    <div className="flex items-center justify-center gap-3">
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all
                            ${isAISpeaking
                                ? "bg-neutral-800 text-neutral-500"
                                : sttFailed
                                    ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                    : "bg-green-500/10 text-green-400 border border-green-500/20"
                            }`}>
                            {isAISpeaking ? (
                                <><MicOff className="w-4 h-4" /> Listening paused</>
                            ) : sttFailed ? (
                                <><MicOff className="w-4 h-4" /> Voice unavailable — use text below</>
                            ) : (
                                <><Mic className="w-4 h-4 animate-pulse" /> Listening (5s silence = answer submitted)</>
                            )}
                        </div>
                    </div>
                )}

                {/* Error banner */}
                {errorMsg && !sttFailed && (
                    <div className="flex items-center gap-2 text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <p className="text-sm">{errorMsg}</p>
                    </div>
                )}

                {/* Transcript */}
                <div className="flex-1 bg-neutral-900/50 border border-neutral-800 rounded-2xl overflow-hidden flex flex-col min-h-0">
                    <div className="px-4 py-3 border-b border-neutral-800">
                        <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Live Transcript</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-48 max-h-80">
                        {transcript.length === 0 && !partialText && (
                            <p className="text-neutral-600 text-sm text-center mt-4">
                                Your conversation will appear here as you speak…
                            </p>
                        )}
                        {transcript.map((entry, i) => (
                            <div key={i} className={`flex gap-2 ${entry.speaker === "AI" ? "justify-start" : "justify-end"}`}>
                                <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                                    ${entry.speaker === "AI"
                                        ? "bg-neutral-800 text-neutral-200 rounded-tl-sm"
                                        : "bg-orange-600/90 text-white rounded-tr-sm"}`}>
                                    {entry.text}
                                </div>
                            </div>
                        ))}
                        {/* Partial transcript (live interim) */}
                        {partialText && !isAISpeaking && (
                            <div className="flex justify-end">
                                <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm bg-orange-600/40 text-orange-200 italic">
                                    {partialText}…
                                </div>
                            </div>
                        )}
                        <div ref={transcriptEndRef} />
                    </div>
                </div>

                {/* Manual text input fallback — shown when STT fails */}
                {sttFailed && !isComplete && (
                    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-3">
                        <p className="text-xs text-amber-400 font-medium">Voice recognition unavailable — type your answer below</p>
                        <div className="flex gap-2">
                            <textarea
                                value={manualText}
                                onChange={e => setManualText(e.target.value)}
                                placeholder="Type your answer here…"
                                rows={3}
                                onKeyDown={e => {
                                    if (e.key === "Enter" && e.ctrlKey) handleManualSubmit()
                                }}
                                className="flex-1 bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-sm text-neutral-100 placeholder:text-neutral-600 resize-none focus:outline-none focus:border-orange-500 transition-colors"
                            />
                            <button
                                onClick={handleManualSubmit}
                                disabled={!manualText.trim()}
                                className="self-end p-3 bg-orange-600 hover:bg-orange-700 disabled:opacity-40 disabled:pointer-events-none rounded-xl transition-colors"
                            >
                                <SendHorizontal className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-xs text-neutral-600">Press Ctrl+Enter to submit</p>
                    </div>
                )}
            </div>
        </div>
    )
}
