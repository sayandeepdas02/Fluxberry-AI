/**
 * TTS Service — ElevenLabs
 *
 * Converts AI interviewer text to MP3 audio.
 * Returns a Buffer; caller is responsible for storage / delivery.
 */

import { ElevenLabsClient } from 'elevenlabs'

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || ''
const DEFAULT_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM' // Rachel

export function isTTSConfigured(): boolean {
    return Boolean(ELEVENLABS_API_KEY)
}

let client: ElevenLabsClient | null = null

function getClient(): ElevenLabsClient {
    if (!client) {
        client = new ElevenLabsClient({ apiKey: ELEVENLABS_API_KEY })
    }
    return client
}

/**
 * Convert text to speech. Returns an MP3 Buffer.
 * Uses rachel voice by default — calm, professional, neutral accent.
 */
export async function textToSpeech(
    text: string,
    voiceId: string = DEFAULT_VOICE_ID
): Promise<Buffer> {
    if (!isTTSConfigured()) {
        // Return empty buffer — UI will use silent text-only fallback
        console.warn('[TTS] ElevenLabs not configured — returning empty buffer')
        return Buffer.alloc(0)
    }

    try {
        const el = getClient()
        // generate() returns a readable stream
        const audioStream = await el.generate({
            voice: voiceId,
            text,
            model_id: 'eleven_turbo_v2_5', // low-latency turbo model
        })

        // Collect stream chunks into a Buffer
        const chunks: Uint8Array[] = []
        for await (const chunk of audioStream) {
            chunks.push(chunk)
        }
        return Buffer.concat(chunks)
    } catch (err) {
        console.error('[TTS] ElevenLabs error:', err)
        throw Object.assign(new Error('TTS generation failed'), {
            statusCode: 502,
            code: 'TTS_ERROR',
        })
    }
}
