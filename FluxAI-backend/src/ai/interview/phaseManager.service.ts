import { InterviewContext } from './interviewContext.store';

export type InterviewPhase = 'INTRO' | 'PROJECT_DEEP_DIVE' | 'FUNDAMENTALS' | 'SYSTEM_DESIGN' | 'CULTURE_FIT' | 'SUMMARY';

export const PHASE_SEQUENCE: InterviewPhase[] = [
    'INTRO',
    'PROJECT_DEEP_DIVE',
    'FUNDAMENTALS',
    'SYSTEM_DESIGN',
    'CULTURE_FIT',
    'SUMMARY'
];

export const PHASE_CONFIGS: Record<InterviewPhase, { maxQuestions: number }> = {
    INTRO: { maxQuestions: 2 },
    PROJECT_DEEP_DIVE: { maxQuestions: 6 },
    FUNDAMENTALS: { maxQuestions: 5 },
    SYSTEM_DESIGN: { maxQuestions: 4 },
    CULTURE_FIT: { maxQuestions: 3 },
    SUMMARY: { maxQuestions: 1 }
};

export class PhaseManagerService {

    /**
     * Determines whether the interview should transition to the next phase based on current turn count.
     * Optionally takes external forced conditions (e.g. out of projects).
     */
    public static determineNextPhase(
        currentPhase: string,
        currentPhaseQuestionCount: number,
        forceTransition: boolean = false
    ): string {
        const phaseKey = currentPhase as InterviewPhase;
        const config = PHASE_CONFIGS[phaseKey];

        // Ensure we don't crash on invalid DB state
        if (!config) return PHASE_SEQUENCE[0];

        if (forceTransition || currentPhaseQuestionCount >= config.maxQuestions) {
            const currentIndex = PHASE_SEQUENCE.indexOf(phaseKey);

            // Reached the end
            if (currentIndex >= PHASE_SEQUENCE.length - 1) {
                return 'SUMMARY';
            }

            const nextPhase = PHASE_SEQUENCE[currentIndex + 1];
            console.log(`[PhaseManager] Transitioning from ${currentPhase} to ${nextPhase}`);

            // In a full DDD pub/sub setup, we'd emit INTERVIEW_PHASE_CHANGED here
            return nextPhase;
        }

        return currentPhase; // Stay in current phase
    }
}
