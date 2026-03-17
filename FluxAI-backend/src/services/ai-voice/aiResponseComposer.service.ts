import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export interface AIResponse {
    interviewId: string;
    rawQuestion: string;
    composedSpeech: string;
    tone: 'neutral' | 'probing' | 'encouraging';
    pauseHints: string[];
}

const toneSchema = {
    type: "object",
    properties: {
        composedSpeech: { type: "string" },
        tone: { type: "string", enum: ["neutral", "probing", "encouraging"] },
        pauseHints: { type: "array", items: { type: "string" }, description: "Phrases mapping to breaks." }
    },
    required: ["composedSpeech", "tone", "pauseHints"],
    additionalProperties: false
};

export class AIResponseComposerService {

    /**
     * Translates a direct LLM technical question into a spoken, 
     * humanized interaction with trailing buffers.
     */
    public static async composeConversationalSpeech(interviewId: string, rawQuestion: string): Promise<AIResponse> {
        if (!rawQuestion || rawQuestion.length < 2) {
            throw new Error('[ResponseComposer] Empty raw question provided');
        }

        const systemPrompt = `You are the conversational overlay for an AI Technical Interviewer.
        You will receive a raw logical question. Your job is to rewrite it exactly as a human would speak it in a live call.
        
        Rules:
        1. Keep it brief. Max 2 sentences total. 
        2. Prefix the question with a brief professional acknowledgement (e.g. "That makes sense.", "Interesting.", "I see, let's dive deeper into that.").
        3. Do not add long monologues. The response should sound like an immediate verbal reaction.
        4. Select an appropriate tone. Use 'probing' if it's a deep challenge, 'encouraging' if following up, or 'neutral' for standard progression.`;

        try {
            const completion = await openai.chat.completions.create({
                model: 'gpt-4o-mini',  // Speed is prioritized for low-latency delivery
                temperature: 0.7,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Raw Next Question: "${rawQuestion}"` }
                ],
                response_format: {
                    type: "json_schema",
                    json_schema: {
                        name: "composed_response",
                        schema: toneSchema,
                        strict: true
                    }
                }
            });

            const content = completion.choices[0]?.message?.content;
            if (content) {
                const parsed = JSON.parse(content);
                return {
                    interviewId,
                    rawQuestion,
                    composedSpeech: parsed.composedSpeech,
                    tone: parsed.tone as AIResponse['tone'],
                    pauseHints: parsed.pauseHints
                };
            }

            throw new Error('LLM parse failed');
        } catch (error) {
            console.error(`[AIResponseComposer] Composer failed, using raw fallback:`, error);
            // On failure, fall directly back to the raw orchestrator payload so the interview continues seamlessly
            return {
                interviewId,
                rawQuestion,
                composedSpeech: `Okay. ${rawQuestion}`,
                tone: 'neutral',
                pauseHints: []
            };
        }
    }
}
