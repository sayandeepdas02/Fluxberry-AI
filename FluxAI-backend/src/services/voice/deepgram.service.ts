import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';
import { voiceSessionService } from './voiceSessionService';
import { TranscriptEmitter } from './transcriptEmitter';

export class DeepgramService {
    private static deepgramClient = process.env.DEEPGRAM_API_KEY
        ? createClient(process.env.DEEPGRAM_API_KEY)
        : null;

    public static createStream(interviewId: string, onSpeechStarted: () => void, onSpeechEnded: () => void) {
        if (!this.deepgramClient) {
            console.error("[Deepgram] API key missing, cannot start transcription.");
            return null;
        }

        const connection = this.deepgramClient.listen.live({
            model: 'nova-2',
            language: 'en',
            smart_format: true,
            interim_results: true,
            endpointing: 300,
            punctuate: true
        });

        connection.on(LiveTranscriptionEvents.Open, () => {
            console.log(`[Deepgram] Connection opened for interview ${interviewId}`);
            voiceSessionService.setDeepgramConnection(interviewId, connection);
        });

        connection.on(LiveTranscriptionEvents.Transcript, (data) => {
            const transcript = data.channel.alternatives[0].transcript;
            const isFinal = data.is_final;
            const speechFinal = data.speech_final;

            if (!transcript) return;

            if (transcript.length > 2) {
                if (!isFinal) {
                    TranscriptEmitter.emitPartial(interviewId, 'candidate', transcript);
                } else {
                    TranscriptEmitter.emitFinal(interviewId, 'candidate', transcript);
                }
            }
        });

        connection.on(LiveTranscriptionEvents.SpeechStarted, () => {
            // Reset turn detection timers
            onSpeechStarted();
        });

        connection.on(LiveTranscriptionEvents.UtteranceEnd, () => {
            // Deepgram's internal endpointing has fired
            onSpeechEnded();
        });

        connection.on(LiveTranscriptionEvents.Error, (err) => {
            console.error(`[Deepgram] Error in stream ${interviewId}:`, err);
        });

        connection.on(LiveTranscriptionEvents.Close, () => {
            console.log(`[Deepgram] Connection closed for interview ${interviewId}`);
        });

        return connection;
    }
}
