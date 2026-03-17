import { InterviewTranscript } from '../../database/models';
import { Server as SocketIOServer } from 'socket.io';
import { Queue } from 'bullmq';

export interface TranscriptEvent {
    interviewId: string;
    speaker: 'candidate' | 'AI';
    text: string;
    timestamp: number;
    isPartial: boolean;
}

// Connect to bullmq for transcript pushing
const transcriptStreamQueue = new Queue('transcript_stream', {
    connection: {
        url: process.env.REDIS_URL || 'redis://localhost:6379'
    }
});

export class TranscriptEmitter {
    private static ioInstance: SocketIOServer | null = null;

    public static setSocketServer(io: SocketIOServer) {
        this.ioInstance = io;
    }

    public static async emitPartial(interviewId: string, speaker: 'candidate' | 'AI', text: string) {
        if (!text || text.length < 2) return; // Basic noise filter

        const payload: TranscriptEvent = {
            interviewId,
            speaker,
            text,
            timestamp: Date.now(),
            isPartial: true
        };

        // Broadcast to WebSocket frontend
        if (this.ioInstance) {
            this.ioInstance.to(interviewId).emit('TRANSCRIPT_PARTIAL', payload);
        }
    }

    public static async emitFinal(interviewId: string, speaker: 'candidate' | 'AI', text: string) {
        if (!text || text.trim().length === 0) return;

        const payload: TranscriptEvent = {
            interviewId,
            speaker,
            text,
            timestamp: Date.now(),
            isPartial: false
        };

        // Broadcast to WebSocket frontend
        if (this.ioInstance) {
            this.ioInstance.to(interviewId).emit('TRANSCRIPT_FINAL', payload);
        }

        // Persist to MongoDB document
        try {
            await InterviewTranscript.findOneAndUpdate(
                { interviewId },
                {
                    $push: { messages: payload }
                },
                { upsert: true, new: true }
            );
        } catch (error) {
            console.error(`[TranscriptEmitter] DB Error for ${interviewId}:`, error);
        }

        // Push to Redis Stream for downstream async evaluation/analytics workers
        try {
            await transcriptStreamQueue.add('process_transcript', payload);
        } catch (error) {
            console.error(`[TranscriptEmitter] Redis Error for ${interviewId}:`, error);
        }
    }
}
