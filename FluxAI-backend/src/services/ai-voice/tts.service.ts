import { ElevenLabsClient } from 'elevenlabs';
import { Readable } from 'stream';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || '';
const DEFAULT_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'; // Rachel

let client: ElevenLabsClient | null = null;
function getClient(): ElevenLabsClient {
    if (!client) {
        client = new ElevenLabsClient({ apiKey: ELEVENLABS_API_KEY });
    }
    return client;
}

export class TTSService {

    /**
     * Convert text to an asynchronous stream of PCM chunks (or MP3 chunks).
     * By resolving chunk-by-chunk instead of buffer concatenation, 
     * LiveKit can begin transmitting before generation completes.
     */
    public static async generateStreamingAudio(text: string, voiceId: string = DEFAULT_VOICE_ID): Promise<Readable> {
        if (!ELEVENLABS_API_KEY) {
            console.warn('[TTS Streaming] ElevenLabs not configured — aborting stream');
            const placeholderStream = new Readable();
            placeholderStream.push(null);
            return placeholderStream;
        }

        try {
            const el = getClient();

            // Generate output format: PCM (e.g., pcm_16000) or mp3_44100 depending on WebRTC ingestion requirements
            // LiveKit audio tracks generally expect raw PCM 16-bit 48kHz, but we stick to turbo optimizations for latency.
            const audioStream = await el.generate({
                voice: voiceId,
                text,
                model_id: 'eleven_multilingual_v2',
                voice_settings: {
                    stability: 0.4,
                    similarity_boost: 0.8,
                    style: 0.6,
                    use_speaker_boost: true
                }
            });

            // Convert async iterable to standard Node Stream so downstream services (like LiveKit bridges) can pipe it
            return Readable.from(audioStream as any);

        } catch (err) {
            console.error('[TTS Streaming] Execution Error:', err);
            // Fail safely
            const failStream = new Readable();
            failStream.push(null);
            return failStream;
        }
    }
}
