/**
 * OpenAI Realtime API Hook
 * 
 * Handles WebRTC connection to OpenAI Realtime API for AI interviews.
 * V1: Basic audio streaming, transcript accumulation.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { TranscriptEntry } from '@/lib/api/attempts'

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error'

interface UseOpenAIRealtimeOptions {
    ephemeralToken: string
    model: string
    voice: string
    systemPrompt: string
    onTranscriptUpdate?: (entries: TranscriptEntry[]) => void
    onConnectionChange?: (state: ConnectionState) => void
    onError?: (error: Error) => void
}

interface UseOpenAIRealtimeReturn {
    connectionState: ConnectionState
    transcript: TranscriptEntry[]
    connect: () => Promise<void>
    disconnect: () => void
    isAISpeaking: boolean
    isCandidateSpeaking: boolean
}

export function useOpenAIRealtime({
    ephemeralToken,
    model,
    voice,
    systemPrompt,
    onTranscriptUpdate,
    onConnectionChange,
    onError,
}: UseOpenAIRealtimeOptions): UseOpenAIRealtimeReturn {
    const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected')
    const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
    const [isAISpeaking, setIsAISpeaking] = useState(false)
    const [isCandidateSpeaking, setIsCandidateSpeaking] = useState(false)

    const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
    const dataChannelRef = useRef<RTCDataChannel | null>(null)
    const localStreamRef = useRef<MediaStream | null>(null)
    const audioElementRef = useRef<HTMLAudioElement | null>(null)
    const sessionStartTimeRef = useRef<number>(0)

    const updateConnectionState = useCallback((state: ConnectionState) => {
        setConnectionState(state)
        onConnectionChange?.(state)
    }, [onConnectionChange])

    const addTranscriptEntry = useCallback((entry: TranscriptEntry) => {
        setTranscript(prev => {
            const updated = [...prev, entry]
            onTranscriptUpdate?.(updated)
            return updated
        })
    }, [onTranscriptUpdate])

    const connect = useCallback(async () => {
        if (!ephemeralToken) {
            onError?.(new Error('No ephemeral token provided'))
            return
        }

        try {
            updateConnectionState('connecting')
            sessionStartTimeRef.current = Date.now()

            // Create peer connection
            const pc = new RTCPeerConnection()
            peerConnectionRef.current = pc

            // Set up audio element for AI voice
            const audioEl = new Audio()
            audioEl.autoplay = true
            audioElementRef.current = audioEl

            // Handle incoming audio from OpenAI
            pc.ontrack = (event) => {
                audioEl.srcObject = event.streams[0]
            }

            // Get user media (microphone)
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 24000,
                },
            })
            localStreamRef.current = stream

            // Add microphone track
            stream.getTracks().forEach(track => {
                pc.addTrack(track, stream)
            })

            // Create data channel for events
            const dc = pc.createDataChannel('oai-events')
            dataChannelRef.current = dc

            dc.onopen = () => {
                // Send session configuration
                dc.send(JSON.stringify({
                    type: 'session.update',
                    session: {
                        modalities: ['text', 'audio'],
                        instructions: systemPrompt,
                        voice,
                        input_audio_format: 'pcm16',
                        output_audio_format: 'pcm16',
                        input_audio_transcription: { model: 'whisper-1' },
                        turn_detection: { type: 'server_vad' },
                    },
                }))
            }

            dc.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data)
                    handleRealtimeEvent(data)
                } catch (e) {
                    console.error('Failed to parse realtime event:', e)
                }
            }

            // Create offer
            const offer = await pc.createOffer()
            await pc.setLocalDescription(offer)

            // GA: WebRTC SDP exchange is POST /v1/realtime/calls (not ?model= in URL)
            const response = await fetch('https://api.openai.com/v1/realtime/calls', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${ephemeralToken}`,
                    'Content-Type': 'application/sdp',
                },
                body: offer.sdp,
            })

            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.status}`)
            }

            const answerSdp = await response.text()
            await pc.setRemoteDescription({
                type: 'answer',
                sdp: answerSdp,
            })

            // Monitor connection state
            pc.oniceconnectionstatechange = () => {
                if (pc.iceConnectionState === 'connected') {
                    updateConnectionState('connected')
                } else if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
                    updateConnectionState('error')
                    onError?.(new Error('Connection lost'))
                }
            }

        } catch (error) {
            console.error('Failed to connect:', error)
            updateConnectionState('error')
            onError?.(error as Error)
        }
    }, [ephemeralToken, model, voice, systemPrompt, updateConnectionState, onError])

    const handleRealtimeEvent = useCallback((event: Record<string, unknown>) => {
        const timestamp = Date.now() - sessionStartTimeRef.current

        switch (event.type) {
            case 'response.output_audio_transcript.delta':
            case 'response.audio_transcript.delta':
                setIsAISpeaking(true)
                break

            case 'response.output_audio_transcript.done':
            case 'response.audio_transcript.done':
                setIsAISpeaking(false)
                const aiText = (event.transcript ?? (event as { output_audio_transcript?: string }).output_audio_transcript) as string | undefined
                if (aiText && typeof aiText === 'string') {
                    addTranscriptEntry({
                        speaker: 'AI',
                        text: aiText,
                        timestamp,
                    })
                }
                break

            case 'conversation.item.input_audio_transcription.completed':
                // Candidate finished speaking
                setIsCandidateSpeaking(false)
                if (event.transcript && typeof event.transcript === 'string') {
                    addTranscriptEntry({
                        speaker: 'CANDIDATE',
                        text: event.transcript,
                        timestamp,
                    })
                }
                break

            case 'input_audio_buffer.speech_started':
                setIsCandidateSpeaking(true)
                break

            case 'input_audio_buffer.speech_stopped':
                setIsCandidateSpeaking(false)
                break

            case 'error':
                console.error('Realtime API error:', event.error)
                onError?.(new Error(String(event.error)))
                break
        }
    }, [addTranscriptEntry, onError])

    const disconnect = useCallback(() => {
        // Close data channel
        if (dataChannelRef.current) {
            dataChannelRef.current.close()
            dataChannelRef.current = null
        }

        // Close peer connection
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close()
            peerConnectionRef.current = null
        }

        // Stop local media
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop())
            localStreamRef.current = null
        }

        // Stop audio element
        if (audioElementRef.current) {
            audioElementRef.current.srcObject = null
            audioElementRef.current = null
        }

        updateConnectionState('disconnected')
    }, [updateConnectionState])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            disconnect()
        }
    }, [disconnect])

    return {
        connectionState,
        transcript,
        connect,
        disconnect,
        isAISpeaking,
        isCandidateSpeaking,
    }
}
