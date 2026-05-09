import { Queue, Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { AIResponseComposerService } from './aiResponseComposer.service';
import { VoiceStreamService } from './voiceStream.service';
import { Server as SocketIOServer } from 'socket.io';
import { TranscriptEmitter } from '../voice/transcriptEmitter';
import { voiceSessionService } from '../voice/voiceSessionService';

// Using standard ioredis connection
const redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', { maxRetriesPerRequest: null });

export interface VoicePlaybackJob {
    interviewId: string;
    speechText: string;
    speechId: string;
}

export const voicePlaybackQueue = new Queue('voicePlaybackQueue', { connection: redisConnection });

export class VoiceQueueManager {
    private static ioInstance: SocketIOServer | null = null;

    public static setSocketServer(io: SocketIOServer) {
        this.ioInstance = io;
    }

    /**
     * Initializes the BullMQ worker for asynchronously draining candidate playback loops.
     */
    public static initializeWorker() {
        const worker = new Worker('voicePlaybackQueue', async (job: Job) => {
            const data = job.data as VoicePlaybackJob;
            const { interviewId, speechText, speechId } = data;

            // 1. Double check interruption
            const session = await voiceSessionService.getSession(interviewId);
            if (session?.candidateSpeakingState) {
                console.log(`[PlaybackQueue] Dropping TTS generation for ${interviewId}; Candidate is currently speaking over it.`);
                return;
            }

            // 2. Compose conversational tokens (GPT-4o-mini < 1s)
            console.log(`[PlaybackQueue] Composing conversational overlay...`);
            const composedResponse = await AIResponseComposerService.composeConversationalSpeech(interviewId, speechText);

            // 3. Mark actively speaking
            await voiceSessionService.setAiSpeaking(interviewId, speechId, true);

            // 4. Record permanent Database tracking
            TranscriptEmitter.emitFinal(interviewId, 'AI', composedResponse.composedSpeech);

            // 5. Send Websocket flags for Frontend Avatar lipsync starts
            if (VoiceQueueManager.ioInstance) {
                VoiceQueueManager.ioInstance.to(interviewId).emit('AI_SPEAKING_START', { text: composedResponse.composedSpeech });
            }

            try {
                // 6. Generate and Push real-time Streams directly into LiveKit tracks
                await VoiceStreamService.streamAudioToLiveKit(interviewId, composedResponse.composedSpeech, speechId);
            } catch (err) {
                console.error(`[PlaybackQueue] Delivery failure:`, err);
            } finally {
                // 7. Clear conversational lock
                await voiceSessionService.setAiSpeaking(interviewId, speechId, false);
                if (VoiceQueueManager.ioInstance) {
                    VoiceQueueManager.ioInstance.to(interviewId).emit('AI_SPEAKING_END');
                }
            }

        }, { connection: redisConnection, concurrency: 5 });

        worker.on('failed', (job, err) => {
            console.error(`[PlaybackWorker] Job ${job?.id} failed:`, err);
        });
    }
}

// In standard operation, calling initializeWorker() during Boot mounts the listener
