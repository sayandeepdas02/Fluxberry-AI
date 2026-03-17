import { SpeechSessionManager } from './SpeechSessionManager';
import { TranscriptEmitter } from './transcriptEmitter';

import { interviewOrchestrator } from '../../modules/ai-interview/services/interviewOrchestrator';

export class TurnDetectionService {
    private static SILENCE_THRESHOLD_MS = 600;
    private static MAX_SILENCE_WARNING_MS = 15000;
    private static silenceTimers: Map<string, NodeJS.Timeout> = new Map();
    private static warningTimers: Map<string, NodeJS.Timeout> = new Map();

    public static handleSpeechStarted(interviewId: string) {
        const sessionManager = SpeechSessionManager.getInstance();
        sessionManager.updateSession(interviewId, {
            speakingState: true,
            lastSpeechTimestamp: Date.now()
        });

        this.clearTimers(interviewId);
    }

    public static handleSpeechEnded(interviewId: string) {
        const sessionManager = SpeechSessionManager.getInstance();
        sessionManager.updateSession(interviewId, { speakingState: false });

        this.clearTimers(interviewId);

        // Start the 600ms grace period timer
        const timer = setTimeout(() => {
            this.finalizeTurn(interviewId);
        }, this.SILENCE_THRESHOLD_MS);

        this.silenceTimers.set(interviewId, timer);
    }

    public static resetInactivityWarning(interviewId: string) {
        this.clearTimers(interviewId);

        const warningTimer = setTimeout(() => {
            console.warn(`[TurnDetection] Candidate silence warning for ${interviewId}`);
            // Logic to emit CANDIDATE_SILENCE_WARNING over sockets if needed
        }, this.MAX_SILENCE_WARNING_MS);

        this.warningTimers.set(interviewId, warningTimer);
    }

    private static async finalizeTurn(interviewId: string) {
        const sessionManager = SpeechSessionManager.getInstance();
        const session = sessionManager.getSession(interviewId);

        if (!session) return;

        // Collect all buffered text during this turn
        const fullTranscript = session.transcriptBuffer.join(' ');

        if (fullTranscript.trim().length > 2) {
            console.log(`[TurnDetection] Turn completed for ${interviewId}`);

            // Clear the buffer for the next question
            sessionManager.clearTranscriptBuffer(interviewId);

            // Pass the finalized user chunk to the AI Orchestrator to generate the next reply
            try {
                await interviewOrchestrator.submitTurn(interviewId, fullTranscript);
            } catch (err) {
                console.error(`[TurnDetection] Orchestrator processing failed for ${interviewId}:`, err);
            }
        }

        // Restart inactivity monitor while AI speaks or we wait for the next question
        this.resetInactivityWarning(interviewId);
    }

    private static clearTimers(interviewId: string) {
        if (this.silenceTimers.has(interviewId)) {
            clearTimeout(this.silenceTimers.get(interviewId)!);
            this.silenceTimers.delete(interviewId);
        }
        if (this.warningTimers.has(interviewId)) {
            clearTimeout(this.warningTimers.get(interviewId)!);
            this.warningTimers.delete(interviewId);
        }
    }
}
