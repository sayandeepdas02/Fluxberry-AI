/**
 * Blueprint Registry
 * Maps role → AgentBlueprint. Import this to get the correct blueprint anywhere.
 */

import { backendBlueprint } from './software/backend.blueprint.js'
import { frontendBlueprint } from './software/frontend.blueprint.js'
import { fullstackBlueprint } from './software/fullstack.blueprint.js'
import { devopsBlueprint } from './software/devops.blueprint.js'
import type { AgentBlueprint, RoleType, DifficultyLevel, FundamentalsQuestion } from './types.js'
export type { AgentBlueprint, RoleType, DifficultyLevel, BlueprintEvalResult } from './types.js'
export { blueprintEvalSchema } from './types.js'

export const BLUEPRINTS: Record<RoleType, AgentBlueprint> = {
    BACKEND: backendBlueprint,
    FRONTEND: frontendBlueprint,
    FULLSTACK: fullstackBlueprint,
    DEVOPS: devopsBlueprint,
}

/**
 * Get blueprint for a role. Falls back to BACKEND if unknown role.
 */
export function getBlueprint(role: RoleType): AgentBlueprint {
    return BLUEPRINTS[role] ?? backendBlueprint
}

/**
 * Weighted random selection of fundamentals questions for a given difficulty.
 * Picks between min and max questions (default 4–6).
 *
 * Algorithm:
 * 1. Filter questions applicable to the difficulty level
 * 2. Build a weighted pool (repeat each question `weight` times)
 * 3. Randomly sample without replacement
 */
export function selectFundamentalsQuestions(
    blueprint: AgentBlueprint,
    difficulty: DifficultyLevel,
    maxQuestions = 5
): FundamentalsQuestion[] {
    // Filter eligible questions
    const eligible = blueprint.fundamentalsBank.filter(q =>
        q.difficulty.includes(difficulty)
    )

    if (eligible.length === 0) return []

    // Build weighted pool
    const weightedPool: FundamentalsQuestion[] = []
    for (const q of eligible) {
        for (let i = 0; i < q.weight; i++) {
            weightedPool.push(q)
        }
    }

    // Sample without replacement (Fisher-Yates partial shuffle)
    const result: FundamentalsQuestion[] = []
    const seen = new Set<string>()
    const pool = [...weightedPool]

    while (result.length < maxQuestions && pool.length > 0) {
        const idx = Math.floor(Math.random() * pool.length)
        const picked = pool[idx]
        // Swap and pop for O(1) removal
        pool[idx] = pool[pool.length - 1]
        pool.pop()

        if (!seen.has(picked.question)) {
            seen.add(picked.question)
            result.push(picked)
        }
    }

    return result
}
