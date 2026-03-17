import OpenAI from 'openai';
import { InterviewContext } from './interviewContext.store';
import { ResponseEvaluation } from './responseInterpreter.service';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export class QuestionEngineService {

    /**
     * Layer 1: Base prompt generation for a specific phase
     */
    private static getPhaseSystemInstruction(phase: string): string {
        switch (phase) {
            case 'INTRO':
                return "Ask a very brief, friendly warm-up question about their background.";
            case 'PROJECT_DEEP_DIVE':
                return "Ask a deep architectural question about a specific project they have built. Drill into compromises and scale.";
            case 'FUNDAMENTALS':
                return "Ask a language-specific or algorithmic fundamentals question.";
            case 'SYSTEM_DESIGN':
                return "Propose a broad backend/system design problem relevant to their tech stack.";
            case 'CULTURE_FIT':
                return "Ask a behavioral question about conflict, teamwork, or agile processes.";
            case 'SUMMARY':
                return "Thank the candidate. Wrap up the interview gracefully and ask if they have any brief final questions.";
            default:
                return "Ask a relevant software engineering question.";
        }
    }

    /**
     * Generates the next AI question utilizing context, facts, and grading flags.
     */
    public static async generateNextQuestion(
        context: InterviewContext,
        evaluation?: ResponseEvaluation
    ): Promise<string> {

        // --- Layer 3: Execute Follow-Up ---
        if (evaluation?.followUpNeeded) {
            const flags = evaluation.redFlags.join(', ');
            const systemPrompt = `You are an elite interviewer. The candidate's last answer was insufficient or contradictory.
            Target Role: ${context.jobRole}.
            Identified Red Flags: ${flags}
            
            Generate a targeted, probing follow-up question that challenges the candidate on their weak points or lack of detail. Be direct but professional. Keep it to 1 or 2 sentences max.`;

            return this.invokeLLM(systemPrompt, context);
        }

        // --- Layer 1 & 2: Execute templated Phase question with Facts Injection ---
        const phaseInstruction = this.getPhaseSystemInstruction(context.currentPhase);

        const systemPrompt = `You are building the next question for a ${context.jobRole} AI Interview.
        Current Phase: ${context.currentPhase}.
        Instructions: ${phaseInstruction}
        
        Candidate Context Facts:
        - Technologies: ${context.candidateFacts.technologies.join(', ')}
        - Projects: ${context.candidateFacts.projects.join(', ')}
        - Years Experience: ${context.candidateFacts.experienceYears}
        
        Generate ONLY the text of exactly one new technical or behavioral question. 
        Incorporate knowledge of their specific technologies if possible. 
        Limit to 1 to 2 sentences max. Keep it conversational.`;

        return this.invokeLLM(systemPrompt, context);
    }

    private static async invokeLLM(systemPrompt: string, context: InterviewContext): Promise<string> {
        // Feed recent dialogue memory so AI doesn't repeat itself
        const recentHistory = context.conversationHistory.slice(-4).map(h => `${h.speaker.toUpperCase()}: ${h.text}`).join('\n');

        try {
            const completion = await openai.chat.completions.create({
                model: 'gpt-4o',
                temperature: 0.7,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Recent Conversation Context:\n${recentHistory}\n\nGenerate the next question:` }
                ]
            });

            return completion.choices[0]?.message?.content?.replace(/["']/g, "").trim() || "Let's move on to the next topic.";
        } catch (error) {
            console.error(`[QuestionEngine] LLM Error:`, error);
            // Graceful fallback
            return "Can you tell me more about your recent experience and the tools you utilized?";
        }
    }
}
