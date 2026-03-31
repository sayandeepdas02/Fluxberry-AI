/**
 * ATS Scoring Engine V2 — Type Definitions
 *
 * All V2-specific types live here, keeping the V1 interfaces untouched.
 * The V2 breakdown extends V1's IScoreBreakdown for backward-compat.
 */

import { IScoreBreakdown } from '../models/screening-result.model.js';

// ──────────────────────────────────────────────────────────────
// V2 Weight Configuration
// ──────────────────────────────────────────────────────────────

export interface V2Weights {
    skillWeight: number;        // default 0.35
    experienceWeight: number;   // default 0.30
    projectWeight: number;      // default 0.20
    educationWeight: number;    // default 0.10
    signalBoostWeight: number;  // default 0.05
}

export const DEFAULT_V2_WEIGHTS: V2Weights = {
    skillWeight:      0.35,
    experienceWeight: 0.30,
    projectWeight:    0.20,
    educationWeight:  0.10,
    signalBoostWeight:0.05,
};

// ──────────────────────────────────────────────────────────────
// Skill Match Detail (per required skill)
// ──────────────────────────────────────────────────────────────

export interface SkillMatchDetail {
    /** The required skill being checked */
    skill: string;
    /** The candidate skill that matched best */
    bestMatch: string;
    /** Cosine similarity (0–1) */
    similarity: number;
    /** Classification based on thresholds */
    strength: 'strong' | 'partial' | 'none';
}

// ──────────────────────────────────────────────────────────────
// Similarity Thresholds
// ──────────────────────────────────────────────────────────────

export const SIMILARITY_THRESHOLDS = {
    STRONG:  0.75,
    PARTIAL: 0.50,
    NONE:    0.0,   // anything below PARTIAL
    HARD_GATE_CUTOFF: 0.40,
} as const;

// ──────────────────────────────────────────────────────────────
// V2 Score Breakdown (extends V1 for storage compatibility)
// ──────────────────────────────────────────────────────────────

/**
 * Extends the stored breakdown with V2-specific metadata.
 * The base IScoreBreakdown fields (skillScore, experienceScore, etc.)
 * are still populated for the radar chart. `bonusScore` is set to the
 * same value as `signalBoostScore` for backward compatibility.
 */
export interface V2ScoreBreakdown extends IScoreBreakdown {
    /** Human-readable explainability insights */
    insights: string[];
    /** Per-skill similarity details for recruiter drill-down */
    skillMatchDetails: SkillMatchDetail[];
    /** Signal boost score (replaces bonusScore conceptually) */
    signalBoostScore: number;
}

// ──────────────────────────────────────────────────────────────
// Job Context (data the V2 engine needs beyond parsedData)
// ──────────────────────────────────────────────────────────────

export interface V2JobContext {
    /** Full JD text (Job.description) */
    jobDescription: string;
    /** Job title (Job.title) for experience role matching */
    jobTitle: string;
    /** Required skills from the JD (Job.requiredSkills or hardGates.minimumSkills) */
    requiredSkills: string[];
    /** Pre-computed JD embedding (cached in JobScreeningProfile.jdEmbedding) */
    jdEmbedding?: number[];
    /** Target experience in years (from hardGates) */
    targetExperienceYears: number;
    /** Required education level (from hardGates) */
    requiredEducationLevel?: string;
}

// ──────────────────────────────────────────────────────────────
// V2 Scoring Result (returned by the engine)
// ──────────────────────────────────────────────────────────────

export interface V2ScoringResult {
    breakdown: V2ScoreBreakdown;
    finalScore: number;
    confidence: number;
    hardGatePassed: boolean;
    hardGateReason?: string;
    insights: string[];
    skillMatchDetails: SkillMatchDetail[];
}

// ──────────────────────────────────────────────────────────────
// Project Analysis
// ──────────────────────────────────────────────────────────────

export interface ProjectAnalysis {
    name: string;
    similarity: number;
    penalized: boolean;
    penaltyReason?: string;
}

/** Minimum characters for a project description to be considered non-trivial */
export const MIN_PROJECT_DESCRIPTION_LENGTH = 30;

/** Generic project keywords that trigger a penalty */
export const GENERIC_PROJECT_KEYWORDS = [
    'todo app', 'todo list', 'calculator', 'hello world',
    'weather app', 'counter app', 'tic tac toe', 'tictactoe',
    'notes app', 'basic crud',
];

/** Penalty applied to generic/short project similarity scores */
export const GENERIC_PROJECT_PENALTY = 0.15;
