import { InterviewContextStore } from './interviewContext.store';
import { ConversationMemoryService } from './conversationMemory.service';
import { ResponseInterpreterService } from './responseInterpreter.service';
import { PhaseManagerService } from './phaseManager.service';
import { QuestionEngineService } from './questionEngine.service';
import { voicePlaybackQueue } from '../../services/ai-voice/voicePlaybackQueue';
import { Server as SocketIOServer } from 'socket.io';
import { AssessmentAttempt } from '../../database/models'; // Note: using Attempt over Interview if the schema dictates it

export class InterviewOrchestrator {
    private static ioInstance: SocketIOServer | null = null;

    public static setSocketServer(io: SocketIOServer) {
        this.ioInstance = io;
    }

    /**
     * The primary entry point called by `turnDetection.service.ts` when a candidate finishes speaking.
     */
    public async submitTurn(interviewId: string, candidateTranscript: string) {
        // 1. Load InterviewContext from Redis
        const context = await InterviewContextStore.getContext(interviewId);

        if (!context) {
            console.error(`[Orchestrator] Fatal: Missing session context for ${interviewId}`);
            return { nextMessage: "I seem to have lost our connection. Can you repeat that?", currentPhase: 'FAILED', isComplete: true };
        }

        console.log(`[Orchestrator] Turn Started - Phase: ${context.currentPhase} | Questions: ${context.phaseQuestionCount}`);

        // 2. Append candidate transcript
        context.conversationHistory.push({
            speaker: 'candidate',
            text: candidateTranscript,
            timestamp: Date.now()
        });

        // 3. Extract Memory Facts asynchronously
        const newFacts = await ConversationMemoryService.extractFacts(candidateTranscript, context.candidateFacts);
        context.candidateFacts = newFacts;

        // 4. Evaluate the candidate's last answer
        let previousQuestion = "Please introduce yourself.";
        // Grab the last AI question if available
        for (let i = context.conversationHistory.length - 1; i >= 0; i--) {
            if (context.conversationHistory[i].speaker === 'ai') {
                previousQuestion = context.conversationHistory[i].text;
                break;
            }
        }

        const evaluation = await ResponseInterpreterService.evaluateAnswer(previousQuestion, candidateTranscript, context);

        // Add to total scores
        context.interviewScore.technicalDepth += evaluation.technicalDepth;
        context.interviewScore.communication += evaluation.clarity;

        // 5. Track State Transitions
        let nextPhase = context.currentPhase;

        if (!evaluation.followUpNeeded) {
            context.phaseQuestionCount += 1;
            nextPhase = PhaseManagerService.determineNextPhase(context.currentPhase, context.phaseQuestionCount);

            if (nextPhase !== context.currentPhase) {
                // Phase changed
                console.log(`[Orchestrator] Emit INTERVIEW_PHASE_CHANGED: ${context.currentPhase} -> ${nextPhase}`);
                context.currentPhase = nextPhase;
                context.phaseQuestionCount = 0; // Reset counter for new phase
                if (InterviewOrchestrator.ioInstance) {
                    InterviewOrchestrator.ioInstance.to(interviewId).emit('INTERVIEW_PHASE_CHANGED', { phase: nextPhase });
                }
            }
        } else {
            console.log(`[Orchestrator] Follow-up triggered due to red flags:`, evaluation.redFlags);
        }

        // 6. Generate Next AI Question
        const nextQuestionText = await QuestionEngineService.generateNextQuestion(context, evaluation);

        context.conversationHistory.push({
            speaker: 'ai',
            text: nextQuestionText,
            timestamp: Date.now()
        });

        // 7. Save Back to Redis
        await InterviewContextStore.saveContext(context);

        // 8. Periodically save to MongoDB for permanent durability (every 3 turns)
        if (context.conversationHistory.length % 6 === 0) {
            try {
                // Quick unstructured persistence logic
                await AssessmentAttempt.findByIdAndUpdate(interviewId, {
                    $set: {
                        'metadata.aiCurrentPhase': context.currentPhase,
                        'metadata.aiScore': context.interviewScore,
                        'metadata.aiFacts': context.candidateFacts
                    }
                }, { strict: false });
            } catch (err) {
                console.error(`[Orchestrator] Auto-save failed:`, err);
            }
        }

        // 9. Deliver audio to Frontend Pipeline Voice Systems Queue
        console.log(`[Orchestrator] Enqueueing TTS payload: "${nextQuestionText.substring(0, 40)}..."`);
        await voicePlaybackQueue.add('play_ai_voice', {
            interviewId,
            speechText: nextQuestionText,
            speechId: `ai_turn_${Date.now()}`
        }, { removeOnComplete: true });

        return {
            nextMessage: nextQuestionText,
            currentPhase: nextPhase,
            isComplete: nextPhase === 'SUMMARY' && context.phaseQuestionCount > 0
        };
    }
}

export const interviewOrchestrator = new InterviewOrchestrator();
