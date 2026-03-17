import { createClient } from 'redis';

export interface VoiceSession {
    interviewId: string;
    livekitRoom: string;
    currentSpeechId: string;
    speakingState: boolean;
    startedAt: number;
}

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redisClient = createClient({ url: redisUrl });

redisClient.on('error', (err: any) => console.error('[VoiceSessionManager] Redis Error:', err));
redisClient.connect().catch(console.error);

export class VoiceSessionManager {
    private static getKey(interviewId: string) {
        return `voice_session:${interviewId}`;
    }

    public static async getSession(interviewId: string): Promise<VoiceSession | null> {
        const data = await redisClient.get(this.getKey(interviewId));
        if (!data) return null;
        try {
            return JSON.parse(data) as VoiceSession;
        } catch {
            return null;
        }
    }

    public static async setSpeakingState(interviewId: string, speechId: string, isSpeaking: boolean, roomKey?: string): Promise<void> {
        const session = await this.getSession(interviewId) || {
            interviewId,
            livekitRoom: roomKey || 'unknown',
            currentSpeechId: speechId,
            speakingState: isSpeaking,
            startedAt: Date.now()
        };

        session.speakingState = isSpeaking;
        session.currentSpeechId = speechId;
        if (isSpeaking) {
            session.startedAt = Date.now();
        }

        // Sessions live actively for 4 hours
        await redisClient.setEx(
            this.getKey(interviewId),
            14400,
            JSON.stringify(session)
        );
    }

    public static async clearSession(interviewId: string): Promise<void> {
        await redisClient.del(this.getKey(interviewId));
    }
}
