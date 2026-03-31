/**
 * ATS Scoring Engine V2 — Core Semantic Scoring
 *
 * Replaces V1's rule-based heuristics with hybrid semantic + structured scoring.
 *
 * Final Score =
 *   0.35 × Skill Relevance
 * + 0.30 × Experience Relevance
 * + 0.20 × Project Relevance
 * + 0.10 × Education Fit
 * + 0.05 × Signal Boost
 *
 * All sub-scores are normalized to 0–100 for radar chart compatibility.
 */

import { IResumeParsedData } from '../models/resume-profile.model.js';
import { normalizeSkills } from './skill-normalizer.js';
import { embeddingService } from './embedding.service.js';
import {
    V2JobContext,
    V2ScoreBreakdown,
    V2ScoringResult,
    V2Weights,
    DEFAULT_V2_WEIGHTS,
    SkillMatchDetail,
    ProjectAnalysis,
    SIMILARITY_THRESHOLDS,
    MIN_PROJECT_DESCRIPTION_LENGTH,
    GENERIC_PROJECT_KEYWORDS,
    GENERIC_PROJECT_PENALTY,
} from './types.js';

// ──────────────────────────────────────────────────────────────
// 1. SKILL SCORING (Semantic)
// ──────────────────────────────────────────────────────────────

/**
 * Computes a semantic skill score by comparing each required skill
 * against all candidate skills using cosine similarity on embeddings.
 *
 * Returns { score: 0–100, details: per-skill match info }
 */
export async function computeSkillScore(
    candidateSkills: string[] | undefined,
    requiredSkills: string[],
): Promise<{ score: number; details: SkillMatchDetail[] }> {
    if (!requiredSkills || requiredSkills.length === 0) {
        return { score: 100, details: [] };
    }
    if (!candidateSkills || candidateSkills.length === 0) {
        return {
            score: 0,
            details: requiredSkills.map(s => ({
                skill: s,
                bestMatch: '',
                similarity: 0,
                strength: 'none' as const,
            })),
        };
    }

    // Normalize
    const normalizedRequired = normalizeSkills(requiredSkills);
    const normalizedCandidate = normalizeSkills(candidateSkills);

    // Embed all skills in one batch call
    const allTexts = [...normalizedRequired, ...normalizedCandidate];
    const allEmbeddings = await embeddingService.embedBatch(allTexts);

    const reqEmbeddings = allEmbeddings.slice(0, normalizedRequired.length);
    const candEmbeddings = allEmbeddings.slice(normalizedRequired.length);

    const details: SkillMatchDetail[] = [];
    let totalSimilarity = 0;

    for (let i = 0; i < normalizedRequired.length; i++) {
        let maxSim = 0;
        let bestMatchIdx = 0;

        for (let j = 0; j < normalizedCandidate.length; j++) {
            const sim = embeddingService.cosine(reqEmbeddings[i], candEmbeddings[j]);
            if (sim > maxSim) {
                maxSim = sim;
                bestMatchIdx = j;
            }
        }

        const strength =
            maxSim >= SIMILARITY_THRESHOLDS.STRONG ? 'strong' :
            maxSim >= SIMILARITY_THRESHOLDS.PARTIAL ? 'partial' :
            'none';

        details.push({
            skill: normalizedRequired[i],
            bestMatch: maxSim >= SIMILARITY_THRESHOLDS.PARTIAL ? normalizedCandidate[bestMatchIdx] : '',
            similarity: Math.round(maxSim * 1000) / 1000,
            strength,
        });

        totalSimilarity += maxSim;
    }

    const avgSimilarity = totalSimilarity / normalizedRequired.length;
    const score = Math.round(Math.min(100, avgSimilarity * 100));

    return { score, details };
}

// ──────────────────────────────────────────────────────────────
// 2. EXPERIENCE SCORING (Role Relevance + Duration)
// ──────────────────────────────────────────────────────────────

/**
 * Experience Score = (roleSimilarity × 0.6) + (durationMatch × 0.4)
 *
 * Role similarity: cosine(candidate role titles, JD title)
 * Duration match: partial credit curve towards target years
 */
export async function computeExperienceScore(
    experience: IResumeParsedData['experience'],
    jobTitle: string,
    targetYears: number,
): Promise<number> {
    // If no target, full score
    if (!targetYears || targetYears <= 0) {
        if (!experience || experience.length === 0) return 100;
    }

    if (!experience || experience.length === 0) return 0;

    // ── Duration match ────────────────────────────────────────
    let totalMonths = 0;
    experience.forEach(exp => { totalMonths += exp.durationMonths || 0; });
    const totalYears = totalMonths / 12;

    let durationMatch: number;
    if (targetYears <= 0) {
        durationMatch = 1.0;
    } else if (totalYears >= targetYears) {
        durationMatch = 1.0;
    } else if (totalYears >= targetYears * 0.66) {
        // Partial credit: 2 of 3 years = ~0.8
        durationMatch = 0.6 + (totalYears / targetYears) * 0.4;
    } else {
        durationMatch = totalYears / targetYears;
    }

    // ── Role similarity ───────────────────────────────────────
    let roleSimilarity = 0.5; // Default if no titles available

    if (jobTitle) {
        const roleTitles = experience
            .map(exp => exp.title)
            .filter((t): t is string => !!t && t.trim().length > 0);

        if (roleTitles.length > 0) {
            // Embed all role titles + job title in one call
            const texts = [jobTitle, ...roleTitles];
            const embeddings = await embeddingService.embedBatch(texts);
            const jobEmb = embeddings[0];
            const roleEmbs = embeddings.slice(1);

            // Take the best role match
            let maxRoleSim = 0;
            for (const roleEmb of roleEmbs) {
                const sim = embeddingService.cosine(jobEmb, roleEmb);
                if (sim > maxRoleSim) maxRoleSim = sim;
            }
            roleSimilarity = maxRoleSim;
        }
    }

    const score = (roleSimilarity * 0.6 + durationMatch * 0.4) * 100;
    return Math.round(Math.min(100, Math.max(0, score)));
}

// ──────────────────────────────────────────────────────────────
// 3. PROJECT SCORING (Anti-Gaming)
// ──────────────────────────────────────────────────────────────

/**
 * Embeds each project description, compares with JD embedding,
 * scores based on top-2 project similarities.
 * Penalizes short/generic projects.
 */
export async function computeProjectScore(
    projects: IResumeParsedData['projects'],
    jdEmbedding: number[],
    jobDescription: string,
): Promise<{ score: number; analyses: ProjectAnalysis[] }> {
    if (!projects || projects.length === 0) {
        return { score: 0, analyses: [] };
    }

    // Ensure we have a JD embedding
    let jdEmb = jdEmbedding;
    if (!jdEmb || jdEmb.length === 0) {
        jdEmb = await embeddingService.embed(jobDescription);
    }

    const analyses: ProjectAnalysis[] = [];

    // Batch-embed all project descriptions
    const projectTexts: string[] = [];
    const projectIndices: number[] = [];

    for (let i = 0; i < projects.length; i++) {
        const desc = (projects[i].description || '').trim();
        const name = (projects[i].name || 'Unnamed').trim();

        if (desc.length < MIN_PROJECT_DESCRIPTION_LENGTH) {
            analyses.push({
                name,
                similarity: 0,
                penalized: true,
                penaltyReason: 'Description too short',
            });
        } else {
            projectTexts.push(`${name}: ${desc}`);
            projectIndices.push(i);
            // Placeholder — will be filled after batch embed
            analyses.push({ name, similarity: 0, penalized: false });
        }
    }

    if (projectTexts.length > 0) {
        const projEmbeddings = await embeddingService.embedBatch(projectTexts);

        for (let k = 0; k < projectIndices.length; k++) {
            const idx = projectIndices[k];
            const project = projects[idx];
            const name = (project.name || 'Unnamed').trim();
            const desc = (project.description || '').trim();

            let similarity = embeddingService.cosine(jdEmb, projEmbeddings[k]);

            const isGeneric = GENERIC_PROJECT_KEYWORDS.some(
                kw => desc.toLowerCase().includes(kw) || name.toLowerCase().includes(kw)
            );

            let penalized = false;
            let penaltyReason: string | undefined;

            if (isGeneric) {
                similarity = Math.max(0, similarity - GENERIC_PROJECT_PENALTY);
                penalized = true;
                penaltyReason = 'Generic project detected';
            }

            analyses[idx] = {
                name,
                similarity: Math.round(similarity * 1000) / 1000,
                penalized,
                penaltyReason,
            };
        }
    }

    // Score = average of top 2 project similarities
    const validAnalyses = analyses
        .filter(a => !a.penalized || a.similarity > 0)
        .sort((a, b) => b.similarity - a.similarity);

    if (validAnalyses.length === 0) return { score: 0, analyses };

    const topN = validAnalyses.slice(0, 2);
    const avgSim = topN.reduce((sum, a) => sum + a.similarity, 0) / topN.length;
    const score = Math.round(Math.min(100, avgSim * 100));

    return { score, analyses };
}

// ──────────────────────────────────────────────────────────────
// 4. EDUCATION SCORING
// ──────────────────────────────────────────────────────────────

const EDUCATION_LEVELS: Record<string, number> = {
    'phd': 1.0,
    'doctorate': 1.0,
    'master': 0.85,
    'ms': 0.85,
    'ma': 0.85,
    'mba': 0.85,
    'mtech': 0.85,
    'm.tech': 0.85,
    'bachelor': 0.70,
    'bs': 0.70,
    'ba': 0.70,
    'btech': 0.70,
    'b.tech': 0.70,
    'be': 0.70,
    'b.e': 0.70,
};

/**
 * Education score: maps highest degree to a score.
 * If JD doesn't require education, returns baseline score.
 */
export function computeEducationScore(
    education: IResumeParsedData['education'],
    requiredLevel?: string,
): number {
    if (!education || education.length === 0) {
        if (!requiredLevel || requiredLevel === 'none') return 70;
        return 0;
    }

    let bestScore = 0;

    for (const edu of education) {
        const text = ((edu.level || '') + ' ' + (edu.degree || '')).toLowerCase();

        for (const [keyword, score] of Object.entries(EDUCATION_LEVELS)) {
            if (text.includes(keyword) && score > bestScore) {
                bestScore = score;
            }
        }
    }

    if (bestScore === 0) bestScore = 0.5;

    return Math.round(bestScore * 100);
}

// ──────────────────────────────────────────────────────────────
// 5. SIGNAL BOOST (replaces Bonus abuse)
// ──────────────────────────────────────────────────────────────

/**
 * Signal boost: up to 10 points for strong consistency signals.
 * No more +50 for >10 skills or >3 projects.
 */
export function computeSignalBoost(
    skillScore: number,
    experienceScore: number,
    projectScore: number,
    educationScore: number,
    topProjectSimilarity: number,
): number {
    let boost = 0;

    // +5 if top project is highly relevant (>0.85 similarity)
    if (topProjectSimilarity > 0.85) {
        boost += 5;
    }

    // +3 if skill + experience are both strong (>70)
    if (skillScore > 70 && experienceScore > 70) {
        boost += 3;
    }

    // +2 if high consistency across all sections (all > 60)
    if (skillScore > 60 && experienceScore > 60 && projectScore > 60 && educationScore > 60) {
        boost += 2;
    }

    return Math.min(10, boost);
}

// ──────────────────────────────────────────────────────────────
// 6. HARD GATES V2 (Semantic + Threshold)
// ──────────────────────────────────────────────────────────────

export interface HardGateResult {
    passed: boolean;
    reason?: string;
}

/**
 * V2 Hard Gates:
 * - Semantic skill match average < 40 → FAILED
 * - Experience below minimum threshold → FAILED
 * - Education gate (unchanged from V1)
 */
export function evaluateHardGatesV2(
    parsedData: IResumeParsedData | undefined,
    skillScore: number,
    totalExperienceYears: number,
    minimumExperienceYears: number | undefined,
    requiredEducationLevel: string | undefined,
): HardGateResult {
    if (!parsedData) {
        return { passed: false, reason: 'No resume data available' };
    }

    // Semantic skill gate: average skill similarity < 40% → fail
    if (skillScore < SIMILARITY_THRESHOLDS.HARD_GATE_CUTOFF * 100) {
        return {
            passed: false,
            reason: `Skill match too low (${skillScore}% < ${SIMILARITY_THRESHOLDS.HARD_GATE_CUTOFF * 100}% threshold)`,
        };
    }

    // Experience gate
    if (minimumExperienceYears && minimumExperienceYears > 0) {
        if (totalExperienceYears < minimumExperienceYears) {
            return {
                passed: false,
                reason: `Experience ${totalExperienceYears.toFixed(1)}y < required ${minimumExperienceYears}y`,
            };
        }
    }

    // Education gate
    if (requiredEducationLevel && requiredEducationLevel !== 'none') {
        const reqLevel = requiredEducationLevel.toLowerCase();
        const hasEducation = parsedData.education?.some(edu =>
            (edu.level || '').toLowerCase().includes(reqLevel) ||
            (edu.degree || '').toLowerCase().includes(reqLevel)
        );
        if (!hasEducation) {
            return {
                passed: false,
                reason: `Does not meet required education level: ${requiredEducationLevel}`,
            };
        }
    }

    return { passed: true };
}

// ──────────────────────────────────────────────────────────────
// 7. INSIGHT GENERATION (Explainability)
// ──────────────────────────────────────────────────────────────

/**
 * Generates 2–4 human-readable insight strings from the scoring breakdown.
 */
export function generateInsights(
    skillScore: number,
    experienceScore: number,
    projectScore: number,
    _educationScore: number,
    skillDetails: SkillMatchDetail[],
    topProjectSimilarity: number,
): string[] {
    const insights: string[] = [];

    // ── Skill insights ────────────────────────────────────────
    const strongSkills = skillDetails.filter(d => d.strength === 'strong');
    const missingSkills = skillDetails.filter(d => d.strength === 'none');

    if (strongSkills.length > 0) {
        const names = strongSkills.slice(0, 3).map(s => s.skill).join(', ');
        insights.push(`Strong match in ${names}${strongSkills.length > 3 ? ` and ${strongSkills.length - 3} more` : ''}`);
    }
    if (missingSkills.length > 0 && missingSkills.length <= 3) {
        const names = missingSkills.map(s => s.skill).join(', ');
        insights.push(`Missing or weak match for: ${names}`);
    } else if (missingSkills.length > 3) {
        insights.push(`${missingSkills.length} required skills have weak or no match`);
    }

    // ── Experience insight ────────────────────────────────────
    if (experienceScore >= 80) {
        insights.push('Experience level meets or exceeds requirements');
    } else if (experienceScore >= 60) {
        insights.push('Experience slightly below required level but within range');
    } else if (experienceScore > 0) {
        insights.push('Experience significantly below requirements');
    }

    // ── Project insights ──────────────────────────────────────
    if (topProjectSimilarity > 0.85) {
        insights.push('Projects highly relevant to job requirements');
    } else if (projectScore >= 60) {
        insights.push('Projects show moderate relevance to the role');
    } else if (projectScore > 0) {
        insights.push('Projects have limited relevance to this position');
    }

    return insights;
}

// ──────────────────────────────────────────────────────────────
// 8. CONFIDENCE SCORE V2
// ──────────────────────────────────────────────────────────────

export function computeConfidenceV2(parsedData: IResumeParsedData | undefined): number {
    if (!parsedData) return 0;

    let confidence = 100;

    if (!parsedData.experience || parsedData.experience.length === 0) confidence -= 20;
    if (!parsedData.education || parsedData.education.length === 0) confidence -= 20;
    if (!parsedData.skills || parsedData.skills.length === 0) confidence -= 20;

    // V2: Date completeness penalty
    const hasDates = parsedData.experience?.some(exp => exp.startDate);
    if (!hasDates && parsedData.experience && parsedData.experience.length > 0) confidence -= 15;

    // V2: Description density penalty
    const allDescriptions = parsedData.experience?.map(e => e.description || '').join(' ') || '';
    if (allDescriptions.length < 100 && parsedData.experience && parsedData.experience.length > 0) {
        confidence -= 10;
    }

    // V2: Project description quality
    if (parsedData.projects && parsedData.projects.length > 0) {
        const avgDescLen = parsedData.projects.reduce(
            (sum, p) => sum + (p.description || '').length, 0
        ) / parsedData.projects.length;
        if (avgDescLen < 20) confidence -= 5;
    }

    return Math.max(0, confidence);
}

// ──────────────────────────────────────────────────────────────
// 9. FINAL WEIGHTED SCORE
// ──────────────────────────────────────────────────────────────

export function computeFinalScoreV2(
    skillScore: number,
    experienceScore: number,
    projectScore: number,
    educationScore: number,
    signalBoostScore: number,
    weights: V2Weights = DEFAULT_V2_WEIGHTS,
): number {
    const totalWeight =
        weights.skillWeight +
        weights.experienceWeight +
        weights.projectWeight +
        weights.educationWeight +
        weights.signalBoostWeight;

    if (totalWeight === 0) return 0;

    // Signal boost is 0–10; scale to 0–100 for uniform weighting
    const scaledSignalBoost = signalBoostScore * 10;

    const weighted =
        (skillScore * weights.skillWeight) +
        (experienceScore * weights.experienceWeight) +
        (projectScore * weights.projectWeight) +
        (educationScore * weights.educationWeight) +
        (scaledSignalBoost * weights.signalBoostWeight);

    return Math.round(weighted / totalWeight);
}

// ──────────────────────────────────────────────────────────────
// 10. ORCHESTRATOR — Full V2 Scoring Pipeline
// ──────────────────────────────────────────────────────────────

/**
 * Runs the complete V2 scoring pipeline for a single candidate.
 * This is the main entry point called by ScoringStrategyV2.
 */
export async function scoreCandidate(
    parsedData: IResumeParsedData | undefined,
    jobContext: V2JobContext,
    weights: V2Weights = DEFAULT_V2_WEIGHTS,
): Promise<V2ScoringResult> {
    if (!parsedData) {
        return createEmptyResult('No resume data available');
    }

    // ── Get/compute JD embedding ──────────────────────────────
    let jdEmbedding = jobContext.jdEmbedding;
    if (!jdEmbedding || jdEmbedding.length === 0) {
        jdEmbedding = await embeddingService.embed(jobContext.jobDescription);
    }

    // ── Compute all sub-scores ────────────────────────────────
    const { score: skillScore, details: skillDetails } = await computeSkillScore(
        parsedData.skills,
        jobContext.requiredSkills,
    );

    const experienceScore = await computeExperienceScore(
        parsedData.experience,
        jobContext.jobTitle,
        jobContext.targetExperienceYears,
    );

    const { score: projectScore, analyses: projectAnalyses } = await computeProjectScore(
        parsedData.projects,
        jdEmbedding,
        jobContext.jobDescription,
    );

    const educationScore = computeEducationScore(
        parsedData.education,
        jobContext.requiredEducationLevel,
    );

    // ── Signal boost ──────────────────────────────────────────
    const topProjectSim = projectAnalyses.length > 0
        ? Math.max(...projectAnalyses.map(a => a.similarity))
        : 0;

    const signalBoost = computeSignalBoost(
        skillScore, experienceScore, projectScore, educationScore, topProjectSim,
    );

    // ── Total experience for hard gates ───────────────────────
    let totalExperienceMonths = 0;
    parsedData.experience?.forEach(exp => {
        totalExperienceMonths += exp.durationMonths || 0;
    });
    const totalExperienceYears = totalExperienceMonths / 12;

    // ── Hard gates ────────────────────────────────────────────
    const gateResult = evaluateHardGatesV2(
        parsedData,
        skillScore,
        totalExperienceYears,
        jobContext.targetExperienceYears > 0 ? jobContext.targetExperienceYears : undefined,
        jobContext.requiredEducationLevel,
    );

    // ── Final score ───────────────────────────────────────────
    const finalScore = computeFinalScoreV2(
        skillScore, experienceScore, projectScore, educationScore, signalBoost, weights,
    );

    // ── Insights ──────────────────────────────────────────────
    const insights = generateInsights(
        skillScore, experienceScore, projectScore, educationScore,
        skillDetails, topProjectSim,
    );

    // ── Confidence ────────────────────────────────────────────
    const confidence = computeConfidenceV2(parsedData);

    // ── Build breakdown ───────────────────────────────────────
    const breakdown: V2ScoreBreakdown = {
        // V1-compatible fields for radar chart
        skillScore,
        experienceScore,
        projectScore,
        educationScore,
        bonusScore: signalBoost * 10, // Scale 0-10 → 0-100 for backward compat
        // V2-specific
        signalBoostScore: signalBoost * 10,
        insights,
        skillMatchDetails: skillDetails,
    };

    return {
        breakdown,
        finalScore,
        confidence,
        hardGatePassed: gateResult.passed,
        hardGateReason: gateResult.reason,
        insights,
        skillMatchDetails: skillDetails,
    };
}

// ──────────────────────────────────────────────────────────────
// Helper: Empty result for missing data
// ──────────────────────────────────────────────────────────────

function createEmptyResult(reason: string): V2ScoringResult {
    return {
        breakdown: {
            skillScore: 0,
            experienceScore: 0,
            projectScore: 0,
            educationScore: 0,
            bonusScore: 0,
            signalBoostScore: 0,
            insights: [reason],
            skillMatchDetails: [],
        },
        finalScore: 0,
        confidence: 0,
        hardGatePassed: false,
        hardGateReason: reason,
        insights: [reason],
        skillMatchDetails: [],
    };
}
