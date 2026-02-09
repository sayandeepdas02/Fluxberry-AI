"use client"

/**
 * AI Interview Session Component
 * 
 * Active interview interface with WebRTC connection to OpenAI Realtime API.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, MicOff, Video, VideoOff, Phone, Clock, MessageSquare, Loader2 } from 'lucide-react'
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

    const videoRef = useRef<HTMLVideoElement>(null)
    const transcriptContainerRef = useRef<HTMLDivElement>(null)
    const transcriptSyncRef = useRef<NodeJS.Timeout | null>(null)
    const lastSyncedCountRef = useRef(0)

    // Stable ref for scroll so we don't recreate hook callbacks every render
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

                // Connect to OpenAI Realtime
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
    }, [])

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
        }, 30000) // Every 30 seconds

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

    const getConnectionStateColor = (state: ConnectionState) => {
        switch (state) {
            case 'connected': return 'text-green-500'
            case 'connecting': return 'text-yellow-500'
            case 'error': return 'text-red-500'
            default: return 'text-neutral-500'
        }
    }

    return (
        <div className="min-h-screen bg-neutral-950 text-white flex flex-col">
            {/* Top bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
                <div className="flex items-center gap-4">
                    <span className={`flex items-center gap-2 text-sm ${getConnectionStateColor(connectionState)}`}>
                        <span className="w-2 h-2 rounded-full bg-current" />
                        {connectionState === 'connected' ? 'Live' : connectionState}
                    </span>
                    {connectionState === 'connecting' && (
                        <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />
                    )}
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${timeLeft <= 60 ? 'bg-red-500/20 text-red-400' : 'bg-neutral-800 text-white'}`}>
                    <Clock className="w-4 h-4" />
                    <span className="font-mono text-lg font-medium">{formatTime(timeLeft)}</span>
                </div>
            </div>

            {/* Main content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Video area */}
                <div className="flex-1 flex flex-col p-6">
                    {/* AI interviewer visualization */}
                    <div className="flex-1 bg-neutral-900 rounded-xl flex items-center justify-center relative">
                        <div className={`
                            w-36 h-36 rounded-full bg-gradient-to-br from-orange-500 to-orange-600
                            flex items-center justify-center shadow-xl
                            ${isAISpeaking ? 'animate-pulse ring-4 ring-orange-500/50 ring-offset-4 ring-offset-neutral-900' : ''}
                        `}>
                            <span className="text-5xl font-bold text-white">AI</span>
                        </div>
                        {isAISpeaking && (
                            <div className="absolute bottom-6 left-6 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full text-sm flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                AI is speaking...
                            </div>
                        )}
                    </div>

                    {/* Self video (picture-in-picture) */}
                    <div className="mt-6 relative">
                        <div className="w-52 h-40 bg-neutral-800 rounded-xl overflow-hidden border border-neutral-700 shadow-lg">
                            <video
                                ref={videoRef}
                                autoPlay
                                muted
                                playsInline
                                className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
                            />
                            {isVideoOff && (
                                <div className="w-full h-full flex items-center justify-center">
                                    <VideoOff className="w-8 h-8 text-neutral-500" />
                                </div>
                            )}
                        </div>
                        {isCandidateSpeaking && (
                            <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-500 rounded-full animate-pulse ring-2 ring-green-500/30" />
                        )}
                        <span className="absolute bottom-2 left-2 text-xs bg-black/60 px-2 py-1 rounded">You</span>
                    </div>
                </div>

                {/* Transcript panel */}
                {showTranscript && (
                    <div className="w-96 border-l border-neutral-800 flex flex-col bg-neutral-900/50">
                        <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
                            <span className="text-sm font-semibold">Live Transcript</span>
                            <span className="text-xs text-neutral-500 bg-neutral-800 px-2 py-1 rounded">{transcript.length} messages</span>
                        </div>
                        <div
                            ref={transcriptContainerRef}
                            className="flex-1 overflow-y-auto p-4 space-y-4"
                        >
                            {transcript.length === 0 ? (
                                <div className="text-center text-neutral-500 text-sm py-12">
                                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    Conversation will appear here...
                                </div>
                            ) : (
                                transcript.map((entry, idx) => (
                                    <TranscriptMessage key={idx} entry={entry} />
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Controls — explicit dark styles so icons are always visible (no theme bg conflict) */}
            <div className="flex items-center justify-center gap-5 px-6 py-5 border-t border-neutral-800 bg-neutral-900/50">
                <Button
                    variant="outline"
                    size="lg"
                    onClick={toggleMute}
                    aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                    title={isMuted ? 'Unmute' : 'Mute'}
                    className={`rounded-full w-14 h-14 border-neutral-600 bg-neutral-800 text-white hover:bg-neutral-700 transition-all ${isMuted ? '!bg-red-500/20 !border-red-500 hover:!bg-red-500/30' : ''}`}
                >
                    {isMuted ? <MicOff className="w-6 h-6 shrink-0" /> : <Mic className="w-6 h-6 shrink-0" />}
                </Button>
                <Button
                    variant="outline"
                    size="lg"
                    onClick={toggleVideo}
                    aria-label={isVideoOff ? 'Turn video on' : 'Turn video off'}
                    title={isVideoOff ? 'Video on' : 'Video off'}
                    className={`rounded-full w-14 h-14 border-neutral-600 bg-neutral-800 text-white hover:bg-neutral-700 transition-all ${isVideoOff ? '!bg-red-500/20 !border-red-500 hover:!bg-red-500/30' : ''}`}
                >
                    {isVideoOff ? <VideoOff className="w-6 h-6 shrink-0" /> : <Video className="w-6 h-6 shrink-0" />}
                </Button>
                <Button
                    variant="default"
                    size="lg"
                    onClick={handleEndCall}
                    aria-label="End call"
                    title="End call"
                    className="rounded-full w-16 h-16 bg-red-600 hover:bg-red-700 text-white transition-colors shadow-lg"
                >
                    <Phone className="w-6 h-6 shrink-0 rotate-[135deg]" />
                </Button>
                <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setShowTranscript(!showTranscript)}
                    aria-label={showTranscript ? 'Hide transcript' : 'Show transcript'}
                    title={showTranscript ? 'Hide transcript' : 'Show transcript'}
                    className={`rounded-full w-14 h-14 border-neutral-600 bg-neutral-800 text-white hover:bg-neutral-700 transition-all ${showTranscript ? '!bg-orange-500/20 !border-orange-500 hover:!bg-orange-500/30' : ''}`}
                >
                    <MessageSquare className="w-6 h-6 shrink-0" />
                </Button>
            </div>
        </div>
    )
}

function TranscriptMessage({ entry }: { entry: TranscriptEntry }) {
    const isAI = entry.speaker === 'AI'
    const timestamp = formatTimestamp(entry.timestamp)

    return (
        <div className={`flex ${isAI ? 'justify-start' : 'justify-end'}`}>
            <div className={`
                max-w-[85%] rounded-xl px-4 py-3 text-sm
                ${isAI ? 'bg-orange-500/20 text-orange-100' : 'bg-neutral-700 text-white'}
            `}>
                <div className={`flex items-center justify-between gap-4 mb-1.5`}>
                    <span className={`text-xs font-semibold ${isAI ? 'text-orange-400' : 'text-neutral-400'}`}>
                        {isAI ? 'AI Interviewer' : 'You'}
                    </span>
                    <span className="text-xs text-neutral-500">{timestamp}</span>
                </div>
                <p className="leading-relaxed">{entry.text}</p>
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
