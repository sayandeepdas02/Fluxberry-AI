/**
 * Feedback Adjuster — Lightweight Micro-Adjustment Engine
 *
 * Analyzes recruiter feedback signals for a job and suggests
 * small weight adjustments to improve scoring alignment with
 * recruiter preferences.
 *
 * V1: Rule-based pattern analysis (no ML)
 * V2: Can be replaced with ML model that trains on feedback data
 *
 * The adjuster NEVER modifies weights directly — it returns
 * suggestions that the recruiter can accept or reject.
 */

import { RecruiterFeedback, FeedbackLabel } from '../models/recruiter-feedback.model.js';

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

export interface SkillPattern {
    skill: string;
    positiveCount: number;
    negativeCount: number;
    /** Net signal: positive - negative. Higher = recruiter likes this skill */
    netSignal: number;
}

export interface FeedbackSummary {
    totalPositive: number;
    totalNegative: number;
    /** Skills that appear frequently in shortlisted candidates */
    preferredSkills: SkillPattern[];
    /** Skills that appear frequently in rejected candidates */
    avoidedSkills: SkillPattern[];
    /** Average scores of positive vs negative candidates */
    avgScores: {
        positive: { skill: number; experience: number; project: number; education: number } | null;
        negative: { skill: number; experience: number; project: number; education: number } | null;
    };
    /** Suggested micro-adjustments (if ≥5 signals) */
    suggestions: WeightSuggestion[];
}

export interface WeightSuggestion {
    dimension: 'skills' | 'experience' | 'projects' | 'education';
    currentWeight: number;
    suggestedDelta: number;
    reason: string;
}

// ──────────────────────────────────────────────────────────────
// Main Analysis Function
// ──────────────────────────────────────────────────────────────

/**
 * Analyzes feedback for a job and returns patterns + suggestions.
 * Requires at least 5 total signals to generate suggestions.
 */
export async function analyzeFeedback(
    jobId: string,
    orgId: string,
    currentWeights?: {
        skillWeight: number;
        experienceWeight: number;
        projectWeight: number;
        educationWeight: number;
        bonusWeight: number;
    },
): Promise<FeedbackSummary> {
    const allFeedback = await RecruiterFeedback.find({
        jobId,
        organizationId: orgId,
    }).lean();

    const positive = allFeedback.filter(f => f.label === 'POSITIVE');
    const negative = allFeedback.filter(f => f.label === 'NEGATIVE');

    // ── Skill Pattern Analysis ──
    const skillMap = new Map<string, { pos: number; neg: number }>();

    for (const fb of positive) {
        for (const skill of fb.candidateSkills || []) {
            const key = skill.toLowerCase();
            const entry = skillMap.get(key) || { pos: 0, neg: 0 };
            entry.pos++;
            skillMap.set(key, entry);
        }
    }

    for (const fb of negative) {
        for (const skill of fb.candidateSkills || []) {
            const key = skill.toLowerCase();
            const entry = skillMap.get(key) || { pos: 0, neg: 0 };
            entry.neg++;
            skillMap.set(key, entry);
        }
    }

    const allPatterns: SkillPattern[] = Array.from(skillMap.entries())
        .map(([skill, { pos, neg }]) => ({
            skill,
            positiveCount: pos,
            negativeCount: neg,
            netSignal: pos - neg,
        }))
        .sort((a, b) => Math.abs(b.netSignal) - Math.abs(a.netSignal));

    const preferredSkills = allPatterns.filter(p => p.netSignal > 0).slice(0, 10);
    const avoidedSkills = allPatterns.filter(p => p.netSignal < 0).slice(0, 10);

    // ── Average Score Breakdown ──
    const avgScores = {
        positive: computeAvgBreakdown(positive),
        negative: computeAvgBreakdown(negative),
    };

    // ── Suggestions (requires ≥5 signals) ──
    const suggestions: WeightSuggestion[] = [];
    const totalSignals = positive.length + negative.length;

    if (totalSignals >= 5 && currentWeights && avgScores.positive && avgScores.negative) {
        const posAvg = avgScores.positive;
        const negAvg = avgScores.negative;

        // If shortlisted candidates consistently score higher in a dimension
        // than rejected ones, suggest boosting that weight slightly
        const dimensions = [
            { key: 'skills' as const, posVal: posAvg.skill, negVal: negAvg.skill, weight: currentWeights.skillWeight },
            { key: 'experience' as const, posVal: posAvg.experience, negVal: negAvg.experience, weight: currentWeights.experienceWeight },
            { key: 'projects' as const, posVal: posAvg.project, negVal: negAvg.project, weight: currentWeights.projectWeight },
            { key: 'education' as const, posVal: posAvg.education, negVal: negAvg.education, weight: currentWeights.educationWeight },
        ];

        for (const dim of dimensions) {
            const gap = dim.posVal - dim.negVal;

            // Strong positive differential → suggest boosting
            if (gap > 15 && dim.weight < 0.50) {
                suggestions.push({
                    dimension: dim.key,
                    currentWeight: dim.weight,
                    suggestedDelta: Math.min(0.05, 0.50 - dim.weight),
                    reason: `Shortlisted candidates score ${Math.round(gap)} points higher in ${dim.key}`,
                });
            }

            // Strong negative differential → suggest reducing
            if (gap < -10 && dim.weight > 0.05) {
                suggestions.push({
                    dimension: dim.key,
                    currentWeight: dim.weight,
                    suggestedDelta: Math.max(-0.05, 0.05 - dim.weight),
                    reason: `${dim.key} scores don't differentiate good candidates`,
                });
            }
        }
    }

    return {
        totalPositive: positive.length,
        totalNegative: negative.length,
        preferredSkills,
        avoidedSkills,
        avgScores,
        suggestions,
    };
}

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

function computeAvgBreakdown(
    feedbacks: Array<{ scoreBreakdown?: { skillScore: number; experienceScore: number; projectScore: number; educationScore: number } }>,
): { skill: number; experience: number; project: number; education: number } | null {
    const withBreakdown = feedbacks.filter(f => f.scoreBreakdown);
    if (withBreakdown.length === 0) return null;

    const totals = { skill: 0, experience: 0, project: 0, education: 0 };
    for (const fb of withBreakdown) {
        totals.skill += fb.scoreBreakdown!.skillScore || 0;
        totals.experience += fb.scoreBreakdown!.experienceScore || 0;
        totals.project += fb.scoreBreakdown!.projectScore || 0;
        totals.education += fb.scoreBreakdown!.educationScore || 0;
    }

    const n = withBreakdown.length;
    return {
        skill: Math.round(totals.skill / n),
        experience: Math.round(totals.experience / n),
        project: Math.round(totals.project / n),
        education: Math.round(totals.education / n),
    };
}
