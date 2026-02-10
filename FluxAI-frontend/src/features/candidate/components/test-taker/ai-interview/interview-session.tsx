"use client"

/**
 * AI Interview Session Component – V2
 * 
 * Wellfound-style asynchronous AI interview with:
 * - Clear speaker turn indicators ("AI is speaking" / "Your turn")
 * - Animated AI avatar with speaking pulse
 * - Self video PIP (bottom-right)
 * - Live transcript panel with proper speaker alignment
 * - Single session timer (15 min)
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, MicOff, Video, VideoOff, Phone, Clock, MessageSquare, Loader2, User } from 'lucide-react'
import { useOpenAIRealtime, ConnectionState } from '@/features/candidate/hooks/use-openai-realtime'
import { attemptsApi, TranscriptEntry } from '@/lib/api/attempts'

interface InterviewSessionProps {
    attemptId: string
    sessionId: string
    ephemeralToken: string
    model: string
    voice: string
    systemPrompt: string
    durationSeconds: number
    startedAt: string
    onEndInterview: (reason: 'COMPLETED' | 'TIMEOUT' | 'CANDIDATE_EXIT') => void
}

export function InterviewSession({
    attemptId,
    sessionId,
    ephemeralToken,
    model,
    voice,
    systemPrompt,
    durationSeconds,
    startedAt,
    onEndInterview,
}: InterviewSessionProps) {
    const [timeLeft, setTimeLeft] = useState(durationSeconds)
    const [isMuted, setIsMuted] = useState(false)
    const [isVideoOff, setIsVideoOff] = useState(false)
    const [showTranscript, setShowTranscript] = useState(true)
    const [localStream, setLocalStream] = useState<MediaStream | null>(null)
    const [showEndConfirm, setShowEndConfirm] = useState(false)

    const videoRef = useRef<HTMLVideoElement>(null)
    const transcriptContainerRef = useRef<HTMLDivElement>(null)
    const transcriptSyncRef = useRef<NodeJS.Timeout | null>(null)
    const lastSyncedCountRef = useRef(0)

    const scrollTranscriptToBottom = useCallback(() => {
        if (transcriptContainerRef.current) {
            transcriptContainerRef.current.scrollTop = transcriptContainerRef.current.scrollHeight
        }
    }, [])

    const handleRealtimeError = useCallback((error: Error) => {
        console.error('Realtime error:', error)
    }, [])

    // OpenAI Realtime connection
    const {
        connectionState,
        transcript,
        connect,
        disconnect,
        isAISpeaking,
        isCandidateSpeaking,
    } = useOpenAIRealtime({
        ephemeralToken,
        model,
        voice,
        systemPrompt,
        onTranscriptUpdate: scrollTranscriptToBottom,
        onError: handleRealtimeError,
    })

    // Initialize local media and connect
    useEffect(() => {
        const init = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true,
                })
                setLocalStream(stream)
                if (videoRef.current) {
                    videoRef.current.srcObject = stream
                }
                await connect()
            } catch (error) {
                console.error('Failed to initialize:', error)
            }
        }
        init()

        return () => {
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop())
            }
            disconnect()
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // Timer countdown
    useEffect(() => {
        const started = new Date(startedAt).getTime()

        const timer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - started) / 1000)
            const remaining = Math.max(0, durationSeconds - elapsed)
            setTimeLeft(remaining)

            if (remaining <= 0) {
                clearInterval(timer)
                onEndInterview('TIMEOUT')
            }
        }, 1000)

        return () => clearInterval(timer)
    }, [startedAt, durationSeconds, onEndInterview])

    // Sync transcript to backend periodically
    useEffect(() => {
        transcriptSyncRef.current = setInterval(() => {
            if (transcript.length > lastSyncedCountRef.current) {
                const newEntries = transcript.slice(lastSyncedCountRef.current)
                attemptsApi.saveTranscript(attemptId, sessionId, newEntries)
                    .catch(console.error)
                lastSyncedCountRef.current = transcript.length
            }
        }, 15000) // Every 15 seconds

        return () => {
            if (transcriptSyncRef.current) {
                clearInterval(transcriptSyncRef.current)
            }
            // Final sync on unmount
            if (transcript.length > lastSyncedCountRef.current) {
                attemptsApi.saveTranscript(attemptId, sessionId, transcript.slice(lastSyncedCountRef.current))
                    .catch(console.error)
            }
        }
    }, [attemptId, sessionId, transcript])

    const toggleMute = useCallback(() => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0]
            if (audioTrack) {
                audioTrack.enabled = isMuted
                setIsMuted(!isMuted)
            }
        }
    }, [localStream, isMuted])

    const toggleVideo = useCallback(() => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0]
            if (videoTrack) {
                videoTrack.enabled = isVideoOff
                setIsVideoOff(!isVideoOff)
            }
        }
    }, [localStream, isVideoOff])

    const handleEndCall = useCallback(() => {
        // Final transcript sync
        if (transcript.length > lastSyncedCountRef.current) {
            attemptsApi.saveTranscript(attemptId, sessionId, transcript.slice(lastSyncedCountRef.current))
                .catch(console.error)
        }
        disconnect()
        onEndInterview('CANDIDATE_EXIT')
    }, [attemptId, sessionId, transcript, disconnect, onEndInterview])

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const isLowTime = timeLeft <= 120
    const isCriticalTime = timeLeft <= 60

    return (
        <div className="h-screen bg-neutral-950 text-white flex flex-col overflow-hidden">
            {/* ── Top Bar ──────────────────────────────────────────── */}
            <header className="h-14 flex items-center justify-between px-5 border-b border-neutral-800/60 bg-neutral-950 shrink-0">
                <div className="flex items-center gap-3">
                    {/* Connection indicator */}
                    <ConnectionIndicator state={connectionState} />
                    <div className="h-4 w-px bg-neutral-700" />
                    {/* Speaker state */}
                    <SpeakerIndicator isAISpeaking={isAISpeaking} isCandidateSpeaking={isCandidateSpeaking} />
                </div>

                {/* Timer */}
                <div className={`
                    flex items-center gap-2 px-4 py-1.5 rounded-full font-mono text-sm font-semibold tracking-wide transition-all
                    ${isCriticalTime ? 'bg-red-500/20 text-red-400 animate-pulse' :
                        isLowTime ? 'bg-amber-500/15 text-amber-400' :
                            'bg-neutral-800/60 text-neutral-300'}
                `}>
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatTime(timeLeft)}</span>
                </div>
            </header>

            {/* ── Main Content ─────────────────────────────────────── */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left: Interview Area */}
                <div className="flex-1 flex flex-col p-6 gap-6 relative">
                    {/* AI Interviewer */}
                    <div className="flex-1 bg-neutral-900/50 rounded-2xl flex items-center justify-center relative border border-neutral-800/40">
                        {/* AI Avatar */}
                        <div className="flex flex-col items-center gap-5">
                            {/* Animated rings when speaking */}
                            <div className="relative">
                                {isAISpeaking && (
                                    <>
                                        <div className="absolute inset-0 -m-4 rounded-full bg-orange-500/10 animate-ping" style={{ animationDuration: '2s' }} />
                                        <div className="absolute inset-0 -m-2 rounded-full bg-orange-500/20 animate-pulse" />
                                    </>
                                )}
                                <div className={`
                                    w-28 h-28 rounded-full bg-gradient-to-br from-orange-500 to-orange-600
                                    flex items-center justify-center shadow-2xl transition-all duration-300
                                    ${isAISpeaking ? 'scale-105 shadow-orange-500/30' : 'scale-100'}
                                `}>
                                    <span className="text-4xl font-bold text-white select-none">AI</span>
                                </div>
                            </div>

                            {/* Status label */}
                            <div className={`
                                px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-all duration-300
                                ${isAISpeaking
                                    ? 'bg-orange-500/15 text-orange-300 border border-orange-500/30'
                                    : 'bg-neutral-800/50 text-neutral-500 border border-neutral-700/30'}
                            `}>
                                <span className={`w-2 h-2 rounded-full ${isAISpeaking ? 'bg-orange-400 animate-pulse' : 'bg-neutral-600'}`} />
                                {isAISpeaking ? 'AI is speaking...' : 'Listening...'}
                            </div>
                        </div>
                    </div>

                    {/* Self Video PIP — bottom right */}
                    <div className="absolute bottom-24 right-10">
                        <div className={`
                            w-48 h-36 bg-neutral-800 rounded-xl overflow-hidden border-2 shadow-2xl transition-all duration-300
                            ${isCandidateSpeaking ? 'border-green-500/60 shadow-green-500/20' : 'border-neutral-700/50'}
                        `}>
                            <video
                                ref={videoRef}
                                autoPlay
                                muted
                                playsInline
                                className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
                            />
                            {isVideoOff && (
                                <div className="w-full h-full flex items-center justify-center bg-neutral-900">
                                    <User className="w-10 h-10 text-neutral-600" />
                                </div>
                            )}
                        </div>
                        {/* You label + speaking indicator */}
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-neutral-500 font-medium">You</span>
                            {isCandidateSpeaking && (
                                <span className="text-xs text-green-400 font-medium flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                    Speaking
                                </span>
                            )}
                            {isMuted && (
                                <span className="text-xs text-red-400 font-medium flex items-center gap-1">
                                    <MicOff className="w-3 h-3" />
                                    Muted
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Transcript Panel */}
                {showTranscript && (
                    <div className="w-[380px] border-l border-neutral-800/60 flex flex-col bg-neutral-900/30 shrink-0">
                        {/* Transcript header */}
                        <div className="px-5 py-3.5 border-b border-neutral-800/60 flex items-center justify-between">
                            <span className="text-sm font-semibold text-neutral-200">Live Transcript</span>
                            <span className="text-xs text-neutral-500 bg-neutral-800/60 px-2.5 py-1 rounded-full tabular-nums">
                                {transcript.length}
                            </span>
                        </div>

                        {/* Transcript body */}
                        <div
                            ref={transcriptContainerRef}
                            className="flex-1 overflow-y-auto px-5 py-4 space-y-3"
                        >
                            {transcript.length === 0 ? (
                                <div className="text-center text-neutral-500 text-sm py-16">
                                    <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-40" />
                                    <p>Interview will appear here...</p>
                                    <p className="text-xs text-neutral-600 mt-1">Waiting for AI to begin</p>
                                </div>
                            ) : (
                                transcript.map((entry, idx) => (
                                    <TranscriptBubble key={idx} entry={entry} />
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Controls Bar ─────────────────────────────────────── */}
            <div className="h-20 flex items-center justify-center gap-4 px-6 border-t border-neutral-800/60 bg-neutral-900/40 shrink-0">
                {/* Mic */}
                <ControlButton
                    icon={isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    label={isMuted ? 'Unmute' : 'Mute'}
                    active={isMuted}
                    danger={isMuted}
                    onClick={toggleMute}
                />

                {/* Video */}
                <ControlButton
                    icon={isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                    label={isVideoOff ? 'Video on' : 'Video off'}
                    active={isVideoOff}
                    danger={isVideoOff}
                    onClick={toggleVideo}
                />

                {/* End Call */}
                <div className="relative">
                    <button
                        onClick={() => setShowEndConfirm(true)}
                        className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-all shadow-lg shadow-red-600/20 hover:shadow-red-600/40 active:scale-95"
                        aria-label="End call"
                    >
                        <Phone className="w-5 h-5 rotate-[135deg]" />
                    </button>

                    {/* End confirm popover */}
                    {showEndConfirm && (
                        <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-neutral-800 border border-neutral-700 rounded-xl p-4 shadow-2xl w-64 z-50">
                            <p className="text-sm text-neutral-200 mb-3">End this interview?</p>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 text-xs border-neutral-600 bg-neutral-700 text-white hover:bg-neutral-600"
                                    onClick={() => setShowEndConfirm(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    className="flex-1 text-xs bg-red-600 hover:bg-red-700 text-white"
                                    onClick={handleEndCall}
                                >
                                    End Interview
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Transcript toggle */}
                <ControlButton
                    icon={<MessageSquare className="w-5 h-5" />}
                    label={showTranscript ? 'Hide transcript' : 'Show transcript'}
                    active={showTranscript}
                    onClick={() => setShowTranscript(!showTranscript)}
                />
            </div>
        </div>
    )
}

// ─── Sub-Components ────────────────────────────────────────

function ConnectionIndicator({ state }: { state: ConnectionState }) {
    const config = {
        connected: { color: 'bg-green-500', text: 'text-green-400', label: 'Live' },
        connecting: { color: 'bg-yellow-500', text: 'text-yellow-400', label: 'Connecting' },
        error: { color: 'bg-red-500', text: 'text-red-400', label: 'Error' },
        disconnected: { color: 'bg-neutral-500', text: 'text-neutral-400', label: 'Disconnected' },
    }
    const c = config[state]

    return (
        <span className={`flex items-center gap-2 text-xs font-medium ${c.text}`}>
            <span className={`w-2 h-2 rounded-full ${c.color} ${state === 'connecting' ? 'animate-pulse' : ''}`} />
            {c.label}
            {state === 'connecting' && <Loader2 className="w-3 h-3 animate-spin" />}
        </span>
    )
}

function SpeakerIndicator({ isAISpeaking, isCandidateSpeaking }: { isAISpeaking: boolean; isCandidateSpeaking: boolean }) {
    if (isAISpeaking) {
        return (
            <span className="text-xs font-medium text-orange-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                AI is speaking
            </span>
        )
    }
    if (isCandidateSpeaking) {
        return (
            <span className="text-xs font-medium text-green-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                You are speaking
            </span>
        )
    }
    return (
        <span className="text-xs font-medium text-neutral-500">
            Waiting...
        </span>
    )
}

function ControlButton({
    icon,
    label,
    active,
    danger,
    onClick,
}: {
    icon: React.ReactNode
    label: string
    active?: boolean
    danger?: boolean
    onClick: () => void
}) {
    return (
        <button
            onClick={onClick}
            aria-label={label}
            title={label}
            className={`
                w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95
                ${danger
                    ? 'bg-red-500/15 border border-red-500/40 text-red-400 hover:bg-red-500/25'
                    : active
                        ? 'bg-orange-500/15 border border-orange-500/40 text-orange-400 hover:bg-orange-500/25'
                        : 'bg-neutral-800 border border-neutral-700 text-neutral-300 hover:bg-neutral-700 hover:text-white'}
            `}
        >
            {icon}
        </button>
    )
}

function TranscriptBubble({ entry }: { entry: TranscriptEntry }) {
    const isAI = entry.speaker === 'AI'
    const time = formatTimestamp(entry.timestamp)

    return (
        <div className={`flex ${isAI ? 'justify-start' : 'justify-end'}`}>
            <div className={`
                max-w-[88%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed
                ${isAI
                    ? 'bg-orange-500/10 text-orange-50 border border-orange-500/10 rounded-bl-md'
                    : 'bg-neutral-800 text-neutral-100 border border-neutral-700/40 rounded-br-md'}
            `}>
                <div className="flex items-center gap-3 mb-1.5">
                    <span className={`text-[11px] font-semibold uppercase tracking-wider ${isAI ? 'text-orange-400/80' : 'text-neutral-400'}`}>
                        {isAI ? 'Interviewer' : 'You'}
                    </span>
                    <span className="text-[10px] text-neutral-600">{time}</span>
                </div>
                <p>{entry.text}</p>
            </div>
        </div>
    )
}

function formatTimestamp(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
