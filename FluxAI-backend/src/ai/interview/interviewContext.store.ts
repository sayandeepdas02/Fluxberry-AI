import { createClient } from 'redis';

// Define the global interview state structure per the user spec
export interface InterviewContext {
    interviewId: string;
    candidateId: string;
    jobRole: string;
    jobLevel: string;
    currentPhase: string;
    conversationHistory: {
        speaker: 'ai' | 'candidate';
        text: string;
        timestamp: number;
    }[];
    candidateFacts: {
        projects: string[];
        technologies: string[];
        claims: string[];
        experienceYears: number;
    };
    phaseQuestionCount: number;
    interviewScore: {
        technicalDepth: number;
        communication: number;
        systemThinking: number;
    };
    createdAt: number;
}

// In a real production setup, connection logic would use a centralized redis singleton.
// We'll scaffold a quick dedicated client or use a global one if process.env.REDIS_URL is provided.
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redisClient = createClient({ url: redisUrl });

redisClient.on('error', (err: any) => console.error('[Redis ContextStore] Error:', err));
// Ensure we connect immediately (non-blocking)
redisClient.connect().catch(console.error);

export class InterviewContextStore {
    private static getKey(interviewId: string) {
        return `interview_context:${interviewId}`;
    }

    public static async getContext(interviewId: string): Promise<InterviewContext | null> {
        const data = await redisClient.get(this.getKey(interviewId));
        if (!data) return null;
        try {
            return JSON.parse(data) as InterviewContext;
        } catch {
            return null;
        }
    }

    public static async saveContext(context: InterviewContext): Promise<void> {
        // Set context with a 24-hour expiration safety net
        await redisClient.setEx(
            this.getKey(context.interviewId),
            86400,
            JSON.stringify(context)
        );
    }

    public static async updateContext(interviewId: string, updates: Partial<InterviewContext>): Promise<InterviewContext> {
        const current = await this.getContext(interviewId);
        if (!current) {
            throw new Error(`[ContextStore] Could not update unknown session ${interviewId}`);
        }

        const merged: InterviewContext = { ...current, ...updates };
        await this.saveContext(merged);
        return merged;
    }

    public static async createInitialContext(interviewId: string, candidateId: string, jobRole: string, jobLevel: string): Promise<InterviewContext> {
        const initial: InterviewContext = {
            interviewId,
            candidateId,
            jobRole,
            jobLevel,
            currentPhase: 'INTRO',
            conversationHistory: [],
            candidateFacts: {
                projects: [],
                technologies: [],
                claims: [],
                experienceYears: 0
            },
            phaseQuestionCount: 0,
            interviewScore: {
                technicalDepth: 0,
                communication: 0,
                systemThinking: 0
            },
            createdAt: Date.now()
        };

        await this.saveContext(initial);
        return initial;
    }
}
