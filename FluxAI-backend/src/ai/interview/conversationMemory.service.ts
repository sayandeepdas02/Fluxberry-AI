import OpenAI from 'openai';
import { InterviewContext } from './interviewContext.store';

// Uses existing LLM key injection 
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// JSON Schema definition for fact extraction
const memorySchema = {
    type: "object",
    properties: {
        projects: { type: "array", items: { type: "string" } },
        technologies: { type: "array", items: { type: "string" } },
        claims: { type: "array", items: { type: "string" } },
        experienceYears: { type: "number", description: "Years of experience deduced, return 0 if none." }
    },
    required: ["projects", "technologies", "claims", "experienceYears"],
    additionalProperties: false
};

export class ConversationMemoryService {

    /**
     * Extracts concrete facts, projects, and tech arrays from the candidate's latest answer.
     * Operates purely functionally — doesn't mutate Redis directly.
     */
    public static async extractFacts(candidateAnswer: string, existingFacts: InterviewContext['candidateFacts']) {
        if (!candidateAnswer || candidateAnswer.length < 10) return existingFacts;

        const systemPrompt = `You are a strict JSON data extractor. Read the candidate's answer and extract arrays of explicitly mentioned software technologies, specific projects they claim to have worked on, and quantifiable claims OR strong professional opinions they give. Returns strict valid JSON matching exactly the schema mapping. Keep previous facts if no new ones are presented.`;

        try {
            const completion = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                temperature: 0.1,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Current Known Facts: ${JSON.stringify(existingFacts)}\n\nNew Answer: "${candidateAnswer}"\n\nMerge these and extract any new facts.` }
                ],
                response_format: {
                    type: "json_schema",
                    json_schema: {
                        name: "candidate_facts",
                        schema: memorySchema,
                        strict: true
                    }
                }
            });

            const content = completion.choices[0]?.message?.content;
            if (content) {
                return JSON.parse(content) as InterviewContext['candidateFacts'];
            }
            return existingFacts;
        } catch (error) {
            console.error(`[ConversationMemory] LLM Extraction Failed`, error);
            // On failure, return unmodified context gracefully so the interview continues
            return existingFacts;
        }
    }
}
