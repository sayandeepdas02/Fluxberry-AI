/**
 * AI Analysis Provider Interface
 * 
 * Pluggable interface for generating structured interview signals.
 * Swap out StubAnalysisProvider for an LLM-backed provider (Ollama, OpenAI, etc.)
 */

export interface ResponseAnalysis {
    summary: string[]
    keyPoints: string[]
    skillsObserved: string[]
    relevance: 'low' | 'medium' | 'high'
}

export interface InterviewSynthesis {
    overallSummary: string
    strengths: string[]
    gaps: string[]
    suggestedFollowUps: string[]
}

export interface IAnalysisProvider {
    analyzeResponse(transcript: string, question: string): Promise<ResponseAnalysis>
    synthesizeInterview(
        analyses: { question: string; transcript: string; analysis: ResponseAnalysis }[],
    ): Promise<InterviewSynthesis>
}

/**
 * Stub Analysis Provider — returns conservative placeholder signals.
 * Replace with an LLM-backed provider for production.
 */
export class StubAnalysisProvider implements IAnalysisProvider {
    async analyzeResponse(transcript: string, question: string): Promise<ResponseAnalysis> {
        console.log(`[Analysis Stub] Generating placeholder analysis for question: ${question.substring(0, 50)}...`)

        // Extract simple keyword-based skills from the transcript
        const skillKeywords = ['javascript', 'typescript', 'react', 'node', 'python', 'api', 'database', 'sql',
            'mongodb', 'aws', 'docker', 'kubernetes', 'git', 'testing', 'ci/cd', 'agile', 'system design',
            'microservices', 'rest', 'graphql', 'redis', 'express', 'next.js', 'html', 'css']
        const lowerTranscript = transcript.toLowerCase()
        const foundSkills = skillKeywords
            .filter(skill => lowerTranscript.includes(skill))
            .map(s => s.charAt(0).toUpperCase() + s.slice(1))

        const wordCount = transcript.split(/\s+/).filter(Boolean).length
        const relevance: 'low' | 'medium' | 'high' = wordCount > 50 ? 'medium' : 'low'

        return {
            summary: [
                `Candidate provided a response of approximately ${wordCount} words.`,
                'Automated analysis pending — integrate an LLM provider for detailed insights.',
            ],
            keyPoints: [
                'Response recorded successfully.',
                `Mentioned ${foundSkills.length} technical keywords.`,
            ],
            skillsObserved: foundSkills.length > 0 ? foundSkills : ['General Communication'],
            relevance,
        }
    }

    async synthesizeInterview(
        analyses: { question: string; transcript: string; analysis: ResponseAnalysis }[],
    ): Promise<InterviewSynthesis> {
        console.log(`[Analysis Stub] Generating synthesis for ${analyses.length} responses`)

        const allSkills = [...new Set(analyses.flatMap(a => a.analysis.skillsObserved))]
        const answeredCount = analyses.filter(a => a.transcript && a.transcript.length > 20).length

        return {
            overallSummary: `Candidate completed ${answeredCount} of ${analyses.length} interview questions. Automated detailed analysis pending — integrate an LLM provider for richer insights.`,
            strengths: [
                `Completed ${answeredCount}/${analyses.length} questions.`,
                ...(allSkills.length > 0 ? [`Mentioned skills: ${allSkills.join(', ')}`] : []),
            ],
            gaps: [
                'Detailed gap analysis requires LLM integration.',
                ...(answeredCount < analyses.length ? [`${analyses.length - answeredCount} questions may have been incomplete.`] : []),
            ],
            suggestedFollowUps: [
                'Consider a live follow-up interview for deeper assessment.',
                'Review video recordings for non-verbal communication signals.',
            ],
        }
    }
}

// Singleton — swap this for your real provider
let analysisProvider: IAnalysisProvider = new StubAnalysisProvider()

export function getAnalysisProvider(): IAnalysisProvider {
    return analysisProvider
}

export function setAnalysisProvider(provider: IAnalysisProvider): void {
    analysisProvider = provider
}
