import { IResumeParsedData } from './models/resume-profile.model.js';
import { IJobScreeningProfile } from './models/job-screening-profile.model.js';
import { IScoreBreakdown } from './models/screening-result.model.js';
import * as ScoringV1 from './scoringEngine.js';

export interface ScoreConfig {
    weights: IJobScreeningProfile['weights'];
    hardGates: IJobScreeningProfile['hardGates'];
}

export interface IScoringStrategy {
    version: string;
    description: string;
    evaluateHardGates(parsedData: IResumeParsedData | undefined, config: ScoreConfig): { passed: boolean; reason?: string };
    generateBreakdown(parsedData: IResumeParsedData | undefined, config: ScoreConfig): IScoreBreakdown;
    calculateFinalScore(breakdown: IScoreBreakdown, weights: ScoreConfig['weights']): number;
    calculateConfidence(parsedData: IResumeParsedData | undefined): number;
}

class ScoringStrategyV1 implements IScoringStrategy {
    version = '1.0.0';
    description = 'Standard rule-based evaluation';

    evaluateHardGates(parsedData: IResumeParsedData | undefined, config: ScoreConfig) {
        return ScoringV1.HardGate(parsedData, config.hardGates);
    }

    generateBreakdown(parsedData: IResumeParsedData | undefined, config: ScoreConfig) {
        return ScoringV1.generateScoreBreakdown(parsedData, config);
    }

    calculateFinalScore(breakdown: IScoreBreakdown, weights: ScoreConfig['weights']) {
        return ScoringV1.FinalWeightedScore(breakdown, weights);
    }

    calculateConfidence(parsedData: IResumeParsedData | undefined) {
        return ScoringV1.ConfidenceScore(parsedData);
    }
}

class ScoringStrategyV2 implements IScoringStrategy {
    version = '2.0.0';
    description = 'Advanced AI Accuracy with Semantic Relevancy';

    evaluateHardGates(parsedData: IResumeParsedData | undefined, config: ScoreConfig) {
        return ScoringV1.HardGate(parsedData, config.hardGates); // Same hard gates for now
    }

    generateBreakdown(parsedData: IResumeParsedData | undefined, config: ScoreConfig) {
        const breakdown = ScoringV1.generateScoreBreakdown(parsedData, config);

        // V2 Mock enhancement: Project Semantic Similarity boosts score
        if (parsedData?.projects && parsedData.projects.length > 0) {
            // Mock: Assumes embedding similarity pushes project score higher
            breakdown.projectScore = Math.min(100, breakdown.projectScore + 15);
        }

        return breakdown;
    }

    calculateFinalScore(breakdown: IScoreBreakdown, weights: ScoreConfig['weights']) {
        return ScoringV1.FinalWeightedScore(breakdown, weights);
    }

    calculateConfidence(parsedData: IResumeParsedData | undefined) {
        if (!parsedData) return 0;

        let confidence = 100;

        // Base penalties
        if (!parsedData.experience || parsedData.experience.length === 0) confidence -= 20;
        if (!parsedData.education || parsedData.education.length === 0) confidence -= 20;
        if (!parsedData.skills || parsedData.skills.length === 0) confidence -= 20;

        // V2 Penalties: Feature completeness / Parsing reliability
        const hasDates = parsedData.experience?.some(exp => exp.startDate);
        if (!hasDates) confidence -= 15;

        // V2 Penalty: Resume density (too short)
        const allDescriptions = parsedData.experience?.map(e => e.description || '').join(' ');
        if (allDescriptions && allDescriptions.length < 100) confidence -= 10;

        return Math.max(0, confidence);
    }
}

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
        return strategy;
    }
}

export const ScoringEngineRegistry = new ScoringEngineRegistryClass();
