import { createClient } from 'redis'

export interface VoiceSessionData {
    interviewId: string
    candidateId: string
    livekitParticipantId: string
    livekitRoom: string
    // AI side
    currentSpeechId: string
    aiSpeakingState: boolean
    aiSpeakingStartedAt: number
    // Candidate side
    candidateSpeakingState: boolean
    lastSpeechTimestamp: number
    transcriptBuffer: string[]
    createdAt: number
}

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
const redisClient = createClient({ url: redisUrl })
redisClient.on('error', (err: any) => console.error('[VoiceSessionService] Redis Error:', err))
redisClient.connect().catch(console.error)

const SESSION_TTL_SECONDS = 4 * 60 * 60 // 4 hours

class VoiceSessionService {
    // deepgramConnection is a live WebSocket — not serializable to Redis, stays in-process
    private deepgramConnections = new Map<string, any>()

    private key(interviewId: string) {
        return `voice_session:${interviewId}`
    }

    private async save(session: VoiceSessionData): Promise<void> {
        await redisClient.setEx(this.key(session.interviewId), SESSION_TTL_SECONDS, JSON.stringify(session))
    }

    async getSession(interviewId: string): Promise<VoiceSessionData | null> {
        const data = await redisClient.get(this.key(interviewId))
        if (!data) return null
        try {
            return JSON.parse(data) as VoiceSessionData
        } catch {
            return null
        }
    }

    async createSession(
        interviewId: string,
        candidateId: string,
        livekitParticipantId: string,
        livekitRoom = 'unknown',
    ): Promise<VoiceSessionData> {
        const session: VoiceSessionData = {
            interviewId,
            candidateId,
            livekitParticipantId,
            livekitRoom,
            currentSpeechId: '',
            aiSpeakingState: false,
            aiSpeakingStartedAt: 0,
            candidateSpeakingState: false,
            lastSpeechTimestamp: Date.now(),
            transcriptBuffer: [],
            createdAt: Date.now(),
        }
        await this.save(session)
        return session
    }

    async setAiSpeaking(interviewId: string, speechId: string, isSpeaking: boolean, roomKey?: string): Promise<void> {
        const session = await this.getSession(interviewId) ?? {
            interviewId,
            candidateId: '',
            livekitParticipantId: '',
            livekitRoom: roomKey ?? 'unknown',
            currentSpeechId: speechId,
            aiSpeakingState: false,
            aiSpeakingStartedAt: 0,
            candidateSpeakingState: false,
            lastSpeechTimestamp: Date.now(),
            transcriptBuffer: [],
            createdAt: Date.now(),
        }
        session.aiSpeakingState = isSpeaking
        session.currentSpeechId = speechId
        if (isSpeaking) session.aiSpeakingStartedAt = Date.now()
        await this.save(session)
    }

    async setCandidateSpeaking(interviewId: string, isSpeaking: boolean): Promise<void> {
        const session = await this.getSession(interviewId)
        if (!session) return
        session.candidateSpeakingState = isSpeaking
        session.lastSpeechTimestamp = Date.now()
        await this.save(session)
    }

    async appendTranscript(interviewId: string, text: string): Promise<void> {
        const session = await this.getSession(interviewId)
        if (!session) return
        session.transcriptBuffer.push(text)
        await this.save(session)
    }

    async clearTranscriptBuffer(interviewId: string): Promise<void> {
        const session = await this.getSession(interviewId)
        if (!session) return
        session.transcriptBuffer = []
        await this.save(session)
    }

    setDeepgramConnection(interviewId: string, connection: any): void {
        this.deepgramConnections.set(interviewId, connection)
    }

    getDeepgramConnection(interviewId: string): any | undefined {
        return this.deepgramConnections.get(interviewId)
    }

    async removeSession(interviewId: string): Promise<void> {
        const conn = this.deepgramConnections.get(interviewId)
        if (conn) {
            try { conn.finish?.() ?? conn.close?.() } catch {}
            this.deepgramConnections.delete(interviewId)
        }
        await redisClient.del(this.key(interviewId))
    }
}

export const voiceSessionService = new VoiceSessionService()
