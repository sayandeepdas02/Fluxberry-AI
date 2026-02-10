/**
 * Speech-to-Text Provider Interface
 * 
 * Pluggable interface for STT providers.
 * Swap out StubSTTProvider for Whisper, Deepgram, Google STT, etc.
 */

export interface TranscriptSegment {
    start: number  // seconds
    end: number    // seconds
    text: string
}

export interface TranscriptionResult {
    text: string
    segments: TranscriptSegment[]
}

export interface ISpeechToTextProvider {
    transcribe(audioBuffer: Buffer, options?: { language?: string }): Promise<TranscriptionResult>
}

/**
 * Stub STT Provider — returns placeholder transcript.
 * Replace with a real provider (Whisper API, Deepgram, etc.) for production.
 */
export class StubSTTProvider implements ISpeechToTextProvider {
    async transcribe(_audioBuffer: Buffer, _options?: { language?: string }): Promise<TranscriptionResult> {
        console.log('[STT Stub] Generating placeholder transcript')
        return {
            text: 'This is a placeholder transcript. Integrate a real STT provider (Whisper, Deepgram, Google STT) by implementing ISpeechToTextProvider.',
            segments: [
                { start: 0, end: 2, text: 'This is a placeholder transcript.' },
                { start: 2, end: 5, text: 'Integrate a real STT provider by implementing ISpeechToTextProvider.' },
            ],
        }
    }
}

// Singleton — swap this for your real provider
let sttProvider: ISpeechToTextProvider = new StubSTTProvider()

export function getSTTProvider(): ISpeechToTextProvider {
    return sttProvider
}

export function setSTTProvider(provider: ISpeechToTextProvider): void {
    sttProvider = provider
}
