import { TurnDetectionService } from './turnDetection.service';
import { DeepgramService } from './deepgram.service';
import { voiceSessionService } from './voiceSessionService';
// Note: Actual media ingress requires @livekit/rtc-node. Using generic TS interfaces for the bridge.
export interface NodeAudioStream { on: (event: string, cb: any) => void; }

export class AudioStreamProcessor {

    public static async attachToLiveKitRoom(interviewId: string, candidateId: string, room: any) {
        room.on('trackSubscribed', (track: any, publication: any, participant: any) => {
            if (track.kind === 'audio' && participant.identity === candidateId) {
                console.log(`[AudioProcessor] Subscribed to candidate audio in room ${interviewId}`);

                // Create the session
                voiceSessionService.createSession(interviewId, candidateId, participant.identity).catch(console.error);

                // Setup Turn Detection timeouts
                TurnDetectionService.resetInactivityWarning(interviewId);

                // Initialize Deepgram WebSocket
                const dgConnection = DeepgramService.createStream(
                    interviewId,
                    () => TurnDetectionService.handleSpeechStarted(interviewId),
                    () => TurnDetectionService.handleSpeechEnded(interviewId)
                );

                if (!dgConnection) return;

                const remoteAudioTrack = track as NodeAudioStream;

                // Read PCM audio frames incrementally in ~20ms chunks without blocking Node.js thread
                // LiveKit Node SDK exposes raw audio via an AudioReceiver or AudioFrame event
                // This is a generic abstraction of `track.on('audioFrame')` which varies slightly per LiveKit version

                remoteAudioTrack.on('audioFrame', (frame: any) => {
                    // Forward audio buffer directly to deepgram
                    if (dgConnection.getReadyState() === 1 /* OPEN */) {
                        try {
                            dgConnection.send(frame.data);
                        } catch (err) {
                            console.error("[AudioProcessor] Error buffering audio to deepgram", err);
                            // Attempt deepgram reconnection logic here if dropped
                        }
                    }
                });
            }
        });

        room.on('participantDisconnected', (participant: any) => {
            if (participant.identity === candidateId) {
                console.log(`[AudioProcessor] Candidate disconnected from ${interviewId}, killing deepgram connection`);
                voiceSessionService.removeSession(interviewId).catch(console.error);
            }
        });
    }
}
