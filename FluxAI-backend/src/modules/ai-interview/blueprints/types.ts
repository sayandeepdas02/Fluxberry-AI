/**
 * Blueprint Types
 * Shared interfaces for all role-specific interview blueprints.
 */

export type DifficultyLevel = 'JUNIOR' | 'MID' | 'SENIOR'
export type RoleType = 'FRONTEND' | 'BACKEND' | 'FULLSTACK' | 'DEVOPS'

export interface FundamentalsQuestion {
    question: string
    topic: string
    difficulty: DifficultyLevel[]
    weight: number   // relative selection weight (higher = more likely to be picked)
}

export interface ProjectFollowUpTriggers {
    ownershipScoreThreshold: number
    tradeoffScoreThreshold: number
    maxFollowUps: number
}

export interface ProjectDeepDive {
    questionSequence: string[]
    followUpTriggers: ProjectFollowUpTriggers
    followUpPrompts: string[]
}

export interface CultureQuestion {
    question: string
    evaluationFocus: string[]
    redFlagSignals: string[]
}

export interface EvaluationOutputSchema {
    correctnessScore: string
    depthScore: string
    clarityScore: string
    realWorldExposureScore: string
    confidenceScore: string
    redFlags: string
    suggestFollowUp: string
    followUpQuestion: string
}

export interface EvaluationRubric {
    outputSchema: EvaluationOutputSchema
    scoringWeights: {
        correctness: number
        depth: number
        clarity: number
        realWorldExposure: number
        confidence: number
    }
    systemInstruction: string
}

export interface ScoringWeights {
    projectDepth: number
    fundamentals: number
    communication: number
    culture: number
}

export interface AgentBlueprint {
    personaPrompt: string
    fundamentalsBank: FundamentalsQuestion[]
    projectDeepDive: ProjectDeepDive
    cultureQuestions: CultureQuestion[]
    evaluationRubric: EvaluationRubric
    scoringWeights: ScoringWeights
}

// ── Zod schema for LLM evaluation response ─────────────────────────────────
// This is the canonical schema — ALL blueprints use this for validation.
import { z } from 'zod'

export const blueprintEvalSchema = z.object({
    correctnessScore: z.number().int().min(0).max(10),
    depthScore: z.number().int().min(0).max(10),
    clarityScore: z.number().int().min(0).max(10),
    realWorldExposureScore: z.number().int().min(0).max(10),
    confidenceScore: z.number().int().min(0).max(10),
    redFlags: z.array(z.string()).default([]),
    suggestFollowUp: z.boolean(),
    followUpQuestion: z.string().default(''),
})

export type BlueprintEvalResult = z.infer<typeof blueprintEvalSchema>
