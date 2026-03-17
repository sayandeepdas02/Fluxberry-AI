export interface SpeechSession {
    interviewId: string;
    candidateId: string;
    livekitParticipantId: string;
    deepgramConnection?: WebSocket;
    transcriptBuffer: string[];
    lastSpeechTimestamp: number;
    speakingState: boolean;
}

export class SpeechSessionManager {
    private static instance: SpeechSessionManager;
    private activeSessions: Map<string, SpeechSession>;

    private constructor() {
        this.activeSessions = new Map<string, SpeechSession>();
    }

    public static getInstance(): SpeechSessionManager {
        if (!SpeechSessionManager.instance) {
            SpeechSessionManager.instance = new SpeechSessionManager();
        }
        return SpeechSessionManager.instance;
    }

    public createSession(interviewId: string, candidateId: string, livekitParticipantId: string): SpeechSession {
        const session: SpeechSession = {
            interviewId,
            candidateId,
            livekitParticipantId,
            transcriptBuffer: [],
            lastSpeechTimestamp: Date.now(),
            speakingState: false
        };
        this.activeSessions.set(interviewId, session);
        return session;
    }

    public getSession(interviewId: string): SpeechSession | undefined {
        return this.activeSessions.get(interviewId);
    }

    public updateSession(interviewId: string, updates: Partial<SpeechSession>): void {
        const session = this.activeSessions.get(interviewId);
        if (session) {
            this.activeSessions.set(interviewId, { ...session, ...updates });
        }
    }

    public removeSession(interviewId: string): void {
        const session = this.activeSessions.get(interviewId);
        if (session?.deepgramConnection) {
            session.deepgramConnection.close();
        }
        this.activeSessions.delete(interviewId);
    }

    public clearTranscriptBuffer(interviewId: string): void {
        this.updateSession(interviewId, { transcriptBuffer: [] });
    }
}
