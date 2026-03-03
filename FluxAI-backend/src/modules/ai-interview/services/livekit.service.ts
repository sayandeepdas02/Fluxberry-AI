/**
 * LiveKit Service — AI Voice Interview
 *
 * Generates server-side access tokens for LiveKit rooms.
 * One room per AIInterviewSession (roomName = sessionId).
 */

import { AccessToken } from 'livekit-server-sdk'

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || ''
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || ''
const LIVEKIT_URL = process.env.LIVEKIT_URL || 'wss://localhost:7880'

export function isLiveKitConfigured(): boolean {
    return Boolean(LIVEKIT_API_KEY && LIVEKIT_API_SECRET)
}

/**
 * Create a short-lived LiveKit access token for a candidate joining an interview room.
 * roomName  = sessionId (one room per interview session)
 * identity  = candidateId or 'candidate-<sessionId>'
 */
export async function createRoomToken(
    sessionId: string,
    identity: string
): Promise<{ token: string; roomName: string; livekitUrl: string }> {
    if (!isLiveKitConfigured()) {
        throw Object.assign(new Error('LiveKit is not configured (LIVEKIT_API_KEY / LIVEKIT_API_SECRET)'), {
            statusCode: 503,
            code: 'LIVEKIT_NOT_CONFIGURED',
        })
    }

    const roomName = `ai-interview-${sessionId}`
    const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
        identity,
        ttl: '2h',
    })
    token.addGrant({
        room: roomName,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
    })

    return {
        token: await token.toJwt(),
        roomName,
        livekitUrl: LIVEKIT_URL,
    }
}
