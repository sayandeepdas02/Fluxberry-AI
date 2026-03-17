import OpenAI from 'openai';
import { InterviewContext } from './interviewContext.store';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export interface ResponseEvaluation {
    technicalDepth: number;
    clarity: number;
    confidence: number;
    redFlags: string[];
    followUpNeeded: boolean;
    internalReasoning: string;
}

const evaluationSchema = {
    type: "object",
    properties: {
        technicalDepth: { type: "number" },
        clarity: { type: "number" },
        confidence: { type: "number" },
        redFlags: { type: "array", items: { type: "string" } },
        followUpNeeded: { type: "boolean" },
        internalReasoning: { type: "string", description: "Why gave this score and why followup is/isnt needed" }
    },
    required: ["technicalDepth", "clarity", "confidence", "redFlags", "followUpNeeded", "internalReasoning"],
    additionalProperties: false
};

export class ResponseInterpreterService {

    public static async evaluateAnswer(
        previousQuestion: string,
        candidateAnswer: string,
        context: InterviewContext
    ): Promise<ResponseEvaluation> {

        const systemPrompt = `You are an elite Staff Engineer technical interviewer evaluator.
        Rate the candidate's last answer to the previous question on a 1-10 scale for technical depth, clarity, and confidence.
        Target Role: ${context.jobRole} (${context.jobLevel}).
        
        Crucially, output 'followUpNeeded' = true if:
        1. The answer is too vague or lacks implementation details.
        2. They contradict a known fact from their resume/previous answers.
        3. They use a technology incorrectly.
        
        RedFlags array should contain short string descriptions of contradictions or deep architectural misunderstandings.
        `;

        try {
            const completion = await openai.chat.completions.create({
                model: 'gpt-4o',  // For deep evaluation, 4o is better than mini
                temperature: 0.3,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `AI Previous Question: "${previousQuestion}"\nCandidate Answer: "${candidateAnswer}"` }
                ],
                response_format: {
                    type: "json_schema",
                    json_schema: {
                        name: "response_evaluation",
                        schema: evaluationSchema,
                        strict: true
                    }
                }
            });

            const content = completion.choices[0]?.message?.content;
            if (content) {
                return JSON.parse(content) as ResponseEvaluation;
            }
            throw new Error('Empty response');
        } catch (error) {
            console.error(`[ResponseInterpreter] Evaluation Failed`, error);
            // Failsafe gracefully to moving onto the next phase instead of gridlocking
            return {
                technicalDepth: 5,
                clarity: 5,
                confidence: 5,
                redFlags: [],
                followUpNeeded: false,
                internalReasoning: "Fallback triggered due to evaluator error."
            };
        }
    }
}
