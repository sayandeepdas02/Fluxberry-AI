/**
 * ATS Scoring Engine — Strategy Registry
 *
 * Supports both V1 (rule-based) and V2 (semantic) strategies.
 * The registry resolves the correct engine by version string.
 *
 * V1: Synchronous, rule-based scoring (wrapped in Promise for interface compat)
 * V2: Async, embedding-powered semantic scoring
 */

import { IResumeParsedData } from './models/resume-profile.model.js';
import { IJobScreeningProfile } from './models/job-screening-profile.model.js';
import { IScoreBreakdown } from './models/screening-result.model.js';
import * as ScoringV1 from './scoringEngine.js';
import * as ScoringV2Engine from './scoring-v2/scoring-engine-v2.js';
import { V2JobContext, V2ScoreBreakdown, DEFAULT_V2_WEIGHTS } from './scoring-v2/types.js';

// ──────────────────────────────────────────────────────────────
// Shared Config
// ──────────────────────────────────────────────────────────────

/**
 * Canonical weight format accepted by all scoring engine strategies.
 * Supports both V1 (bonusWeight) and V2 (signalBoostWeight) formats.
 */
export interface ScoreConfigWeights {
    skillWeight: number;
    experienceWeight: number;
    projectWeight: number;
    educationWeight: number;
    bonusWeight?: number;       // V1
    signalBoostWeight?: number; // V2
}

export interface ScoreConfig {
    weights: ScoreConfigWeights;
    hardGates: IJobScreeningProfile['hardGates'];
}

// ──────────────────────────────────────────────────────────────
// Strategy Interface (Async for V2 embedding support)
// ──────────────────────────────────────────────────────────────

export interface IScoringStrategy {
    version: string;
    description: string;
    evaluateHardGates(
        parsedData: IResumeParsedData | undefined,
        config: ScoreConfig,
        jobContext?: V2JobContext,
    ): Promise<{ passed: boolean; reason?: string }>;
    generateBreakdown(
        parsedData: IResumeParsedData | undefined,
        config: ScoreConfig,
        jobContext?: V2JobContext,
    ): Promise<IScoreBreakdown>;
    calculateFinalScore(
        breakdown: IScoreBreakdown,
        weights: ScoreConfig['weights'],
    ): Promise<number>;
    calculateConfidence(
        parsedData: IResumeParsedData | undefined,
    ): Promise<number>;
}

// ──────────────────────────────────────────────────────────────
// Weight Normalization Helper
// ──────────────────────────────────────────────────────────────

/**
 * Normalize ScoreConfigWeights to the strict V1 engine format.
 * Always ensures bonusWeight is a number (falls back to signalBoostWeight or 0).
 */
function toV1Weights(w: ScoreConfigWeights): {
    skillWeight: number; experienceWeight: number; projectWeight: number;
    educationWeight: number; bonusWeight: number;
} {
    return {
        skillWeight:      w.skillWeight,
        experienceWeight: w.experienceWeight,
        projectWeight:    w.projectWeight,
        educationWeight:  w.educationWeight,
        bonusWeight:      w.bonusWeight ?? w.signalBoostWeight ?? 0.05,
    };
}

// ──────────────────────────────────────────────────────────────
// V1 Strategy (Rule-Based — sync wrapped in Promise)
// ──────────────────────────────────────────────────────────────

class ScoringStrategyV1 implements IScoringStrategy {
    version = '1.0.0';
    description = 'Standard rule-based evaluation';

    async evaluateHardGates(parsedData: IResumeParsedData | undefined, config: ScoreConfig) {
        return ScoringV1.HardGate(parsedData, config.hardGates);
    }

    async generateBreakdown(parsedData: IResumeParsedData | undefined, config: ScoreConfig) {
        return ScoringV1.generateScoreBreakdown(parsedData, { ...config, weights: toV1Weights(config.weights) });
    }

    async calculateFinalScore(breakdown: IScoreBreakdown, weights: ScoreConfig['weights']) {
        return ScoringV1.FinalWeightedScore(breakdown, toV1Weights(weights));
    }

    async calculateConfidence(parsedData: IResumeParsedData | undefined) {
        return ScoringV1.ConfidenceScore(parsedData);
    }
}

// ──────────────────────────────────────────────────────────────
// V2 Strategy (Semantic — delegates to scoring-engine-v2)
// ──────────────────────────────────────────────────────────────

class ScoringStrategyV2 implements IScoringStrategy {
    version = '2.0.0';
    description = 'Hybrid semantic + structured scoring with explainability';

    /**
     * V2 uses a single-pass orchestrator (scoreCandidate) that computes
     * everything together. The processor calls generateBreakdown first,
     * which runs the full pipeline and caches the result. Subsequent calls
     * return cached values.
     */
    private _cachedResult: Awaited<ReturnType<typeof ScoringV2Engine.scoreCandidate>> | null = null;
    private _cacheKey: string = '';

    private getCacheKey(parsedData: IResumeParsedData | undefined): string {
        if (!parsedData) return 'empty';
        return JSON.stringify({
            skills: parsedData.skills?.slice(0, 3),
            expCount: parsedData.experience?.length,
            projCount: parsedData.projects?.length,
        });
    }

    private async ensureScored(
        parsedData: IResumeParsedData | undefined,
        config: ScoreConfig,
        jobContext?: V2JobContext,
    ) {
        const key = this.getCacheKey(parsedData);
        if (this._cachedResult && this._cacheKey === key) {
            return this._cachedResult;
        }

        const ctx: V2JobContext = jobContext || {
            jobDescription: '',
            jobTitle: '',
            requiredSkills: config.hardGates.minimumSkills || [],
            targetExperienceYears: config.hardGates.minimumExperienceYears || 0,
            requiredEducationLevel: config.hardGates.requiredEducationLevel,
        };

        this._cachedResult = await ScoringV2Engine.scoreCandidate(
            parsedData,
            ctx,
            DEFAULT_V2_WEIGHTS,
        );
        this._cacheKey = key;
        return this._cachedResult;
    }

    async evaluateHardGates(
        parsedData: IResumeParsedData | undefined,
        config: ScoreConfig,
        jobContext?: V2JobContext,
    ) {
        const result = await this.ensureScored(parsedData, config, jobContext);
        return {
            passed: result.hardGatePassed,
            reason: result.hardGateReason,
        };
    }

    async generateBreakdown(
        parsedData: IResumeParsedData | undefined,
        config: ScoreConfig,
        jobContext?: V2JobContext,
    ): Promise<V2ScoreBreakdown> {
        const result = await this.ensureScored(parsedData, config, jobContext);
        return result.breakdown;
    }

    async calculateFinalScore(breakdown: IScoreBreakdown, _weights: ScoreConfig['weights']) {
        if (this._cachedResult) {
            return this._cachedResult.finalScore;
        }
        // Fallback: use V1 calculation with normalized weights
        return ScoringV1.FinalWeightedScore(breakdown, toV1Weights(_weights));
    }

    async calculateConfidence(parsedData: IResumeParsedData | undefined) {
        if (this._cachedResult) {
            return this._cachedResult.confidence;
        }
        return ScoringV2Engine.computeConfidenceV2(parsedData);
    }
}

// ──────────────────────────────────────────────────────────────
// Registry (Singleton)
// ──────────────────────────────────────────────────────────────

class ScoringEngineRegistryClass {
    private strategies: Map<string, IScoringStrategy> = new Map();

    constructor() {
        this.register(new ScoringStrategyV1());
        this.register(new ScoringStrategyV2());
    }

    register(strategy: IScoringStrategy) {
        this.strategies.set(strategy.version, strategy);
    }

    getEngine(version: string): IScoringStrategy {
        const strategy = this.strategies.get(version);
        if (!strategy) {
            console.warn(`[ScoringRegistry] Version ${version} not found. Falling back to 1.0.0.`);
            return this.strategies.get('1.0.0')!;
        }
        // For V2, return a fresh instance to avoid cross-candidate cache collisions
        if (version === '2.0.0') {
            return new ScoringStrategyV2();
        }
        return strategy;
    }
}

export const ScoringEngineRegistry = new ScoringEngineRegistryClass();
