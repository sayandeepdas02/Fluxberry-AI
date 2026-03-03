/**
 * STT Service — Deepgram
 *
 * Opens a live transcription connection per interview session.
 * Streams audio data → emits transcript chunks via callback.
 *
 * One connection per session; managed by the gateway.
 */

import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk'
import type { Socket } from 'socket.io'

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY || ''

export function isSTTConfigured(): boolean {
    return Boolean(DEEPGRAM_API_KEY)
}

export interface TranscriptChunk {
    sessionId: string
    textChunk: string
    isFinal: boolean
    confidence: number
}

export interface STTConnection {
    sendAudio(data: ArrayBuffer): void
    close(): void
}

/**
 * Create a live Deepgram STT connection for a session.
 *
 * @param sessionId   - Used to tag emitted events
 * @param socket      - Socket.IO socket to emit transcript chunks on
 * @param onFinal     - Called with the final transcript text when isFinal=true
 * @param onError     - Called on connection error (triggers retry logic in gateway)
 */
export async function createSTTConnection(
    sessionId: string,
    socket: Socket,
    onFinal: (text: string) => void,
    onError: (err: Error) => void
): Promise<STTConnection> {
    if (!isSTTConfigured()) {
        console.warn('[STT] Deepgram not configured — STT disabled')
        // Return a no-op connection so the rest of the flow continues without STT
        return {
            sendAudio: () => { },
            close: () => { },
        }
    }

    const deepgram = createClient(DEEPGRAM_API_KEY)

    const connection = deepgram.listen.live({
        model: 'nova-2',
        language: 'en',
        punctuate: true,
        interim_results: true,
        smart_format: true,
        endpointing: 500,  // ms of silence before sending final result
    })

    connection.on(LiveTranscriptionEvents.Open, () => {
        console.log(`[STT] Deepgram connected for session=${sessionId}`)
    })

    connection.on(LiveTranscriptionEvents.Transcript, (data) => {
        const transcript = data.channel?.alternatives?.[0]
        if (!transcript?.transcript) return

        const chunk: TranscriptChunk = {
            sessionId,
            textChunk: transcript.transcript,
            isFinal: data.is_final ?? false,
            confidence: transcript.confidence ?? 0,
        }

        // Emit chunk to frontend in real-time (even partials)
        socket.emit('transcript_chunk', chunk)

        // On final transcript, call the callback so gateway can accumulate
        if (data.is_final && transcript.transcript.trim()) {
            onFinal(transcript.transcript.trim())
        }
    })

    connection.on(LiveTranscriptionEvents.Error, (err) => {
        console.error(`[STT] Deepgram error for session=${sessionId}:`, err)
        onError(err instanceof Error ? err : new Error(String(err)))
    })

    connection.on(LiveTranscriptionEvents.Close, () => {
        console.log(`[STT] Deepgram connection closed for session=${sessionId}`)
    })

    return {
        sendAudio(data: ArrayBuffer) {
            try {
                connection.send(data as ArrayBuffer)
            } catch (err) {
                console.error('[STT] sendAudio error:', err)
            }
        },
        close() {
            try {
                connection.requestClose()
            } catch {
                // ignore close errors
            }
        },
    }
}
