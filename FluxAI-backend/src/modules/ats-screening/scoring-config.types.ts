/**
 * ATS Scoring Config — Single Source of Truth
 *
 * This file defines the canonical scoring configuration embedded in Job.
 * Every reference to weights, thresholds, and hard gates MUST flow through
 * this type. The old JobScreeningProfile is deprecated.
 *
 * @since P0 Refactor
 */

// ──────────────────────────────────────────────────────────────
// Scoring Config Interface (embedded in Job)
// ──────────────────────────────────────────────────────────────

export interface IScoringConfigWeights {
    skills: number;
    experience: number;
    projects: number;
    education: number;
    signalBoost: number;
}

export interface IScoringConfigThresholds {
    shortlist: number;
    review: number;
    autoReject: number;
}

export interface IScoringConfigHardGates {
    requiredSkills: string[];
    minimumExperienceYears: number;
    requiredEducationLevel?: string;
}

export interface IScoringConfig {
    version: 'v1' | 'v2';
    weights: IScoringConfigWeights;
    thresholds: IScoringConfigThresholds;
    hardGates: IScoringConfigHardGates;
}

// ──────────────────────────────────────────────────────────────
// Default Configuration
// Used during: job creation, migration fallback
// ──────────────────────────────────────────────────────────────

export const DEFAULT_SCORING_CONFIG: IScoringConfig = {
    version: 'v2',
    weights: {
        skills:      0.35,
        experience:  0.30,
        projects:    0.20,
        education:   0.10,
        signalBoost: 0.05,
    },
    thresholds: {
        shortlist:  80,
        review:     60,
        autoReject: 0,
    },
    hardGates: {
        requiredSkills:         [],
        minimumExperienceYears: 0,
    },
};

// ──────────────────────────────────────────────────────────────
// Weight Format Adapters
//
// The old JobScreeningProfile used `skillWeight`, `experienceWeight`, etc.
// The new IScoringConfig uses shorter `skills`, `experience`, etc.
// These adapters bridge the two for backward compatibility.
// ──────────────────────────────────────────────────────────────

export interface LegacyWeights {
    skillWeight: number;
    experienceWeight: number;
    projectWeight: number;
    educationWeight: number;
    bonusWeight: number;
}

export interface LegacyWeightsV2 {
    skillWeight: number;
    experienceWeight: number;
    projectWeight: number;
    educationWeight: number;
    signalBoostWeight: number;
}

/**
 * Convert legacy weight format → new IScoringConfigWeights
 */
export function fromLegacyWeights(legacy: LegacyWeights | LegacyWeightsV2): IScoringConfigWeights {
    return {
        skills:      legacy.skillWeight,
        experience:  legacy.experienceWeight,
        projects:    legacy.projectWeight,
        education:   legacy.educationWeight,
        signalBoost: 'signalBoostWeight' in legacy
            ? legacy.signalBoostWeight
            : legacy.bonusWeight,
    };
}

/**
 * Convert new IScoringConfigWeights → legacy format (for V1 scoring engine compat)
 */
export function toLegacyWeights(weights: IScoringConfigWeights): LegacyWeights {
    return {
        skillWeight:      weights.skills,
        experienceWeight: weights.experience,
        projectWeight:    weights.projects,
        educationWeight:  weights.education,
        bonusWeight:      weights.signalBoost,
    };
}

/**
 * Convert new IScoringConfigWeights → V2 legacy format (for V2 scoring engine compat)
 */
export function toLegacyWeightsV2(weights: IScoringConfigWeights): LegacyWeightsV2 {
    return {
        skillWeight:       weights.skills,
        experienceWeight:  weights.experience,
        projectWeight:     weights.projects,
        educationWeight:   weights.education,
        signalBoostWeight: weights.signalBoost,
    };
}

/**
 * Build a full IScoringConfig from a legacy JobScreeningProfile document.
 * Used during migration and as a runtime fallback for unmigrated jobs.
 */
export function fromLegacyProfile(profile: {
    scoringVersion?: 'v1' | 'v2';
    weights?: LegacyWeights;
    weightsV2?: LegacyWeightsV2;
    thresholds?: { shortlist: number; reviewZone: number; autoReject: number };
    hardGates?: {
        minimumSkills?: string[];
        minimumExperienceYears?: number;
        requiredEducationLevel?: string;
    };
    requiredSkills?: string[];
}): IScoringConfig {
    const version = profile.scoringVersion ?? 'v2';

    // Prefer V2 weights if available, fall back to V1
    const rawWeights = version === 'v2' && profile.weightsV2
        ? profile.weightsV2
        : profile.weights;

    const weights = rawWeights
        ? fromLegacyWeights(rawWeights)
        : DEFAULT_SCORING_CONFIG.weights;

    const thresholds: IScoringConfigThresholds = profile.thresholds
        ? {
            shortlist:  profile.thresholds.shortlist,
            review:     profile.thresholds.reviewZone,
            autoReject: profile.thresholds.autoReject,
        }
        : DEFAULT_SCORING_CONFIG.thresholds;

    const hardGates: IScoringConfigHardGates = {
        requiredSkills:         profile.requiredSkills
            ?? profile.hardGates?.minimumSkills
            ?? [],
        minimumExperienceYears: profile.hardGates?.minimumExperienceYears ?? 0,
        requiredEducationLevel: profile.hardGates?.requiredEducationLevel,
    };

    return { version, weights, thresholds, hardGates };
}
