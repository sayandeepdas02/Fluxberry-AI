import { IResumeParsedData } from './models/resume-profile.model.js';
import { IJobScreeningProfile } from './models/job-screening-profile.model.js';
import { IScoreBreakdown } from './models/screening-result.model.js';

export interface ScoreConfig {
    weights: IJobScreeningProfile['weights'];
    hardGates: IJobScreeningProfile['hardGates'];
}

/**
 * Validates if a candidate meets the minimum required thresholds.
 */
export function HardGate(
    parsedData: IResumeParsedData | undefined,
    hardGates: ScoreConfig['hardGates']
): { passed: boolean; reason?: string } {
    if (!parsedData) {
        return { passed: false, reason: 'No resume data available' };
    }

    const { minimumSkills, minimumExperienceYears } = hardGates;

    // Check minimum experience
    if (minimumExperienceYears && minimumExperienceYears > 0) {
        let totalMonths = 0;
        parsedData.experience?.forEach(exp => {
            totalMonths += exp.durationMonths || 0;
        });
        const totalYears = totalMonths / 12;
        if (totalYears < minimumExperienceYears) {
            return { passed: false, reason: `Experience ${totalYears.toFixed(1)}y < required ${minimumExperienceYears}y` };
        }
    }

    // Check required skills
    if (minimumSkills && minimumSkills.length > 0) {
        const candidateSkills = (parsedData.skills || []).map(s => s.toLowerCase());
        for (const reqSkill of minimumSkills) {
            if (!candidateSkills.includes(reqSkill.toLowerCase())) {
                return { passed: false, reason: `Missing required skill: ${reqSkill}` };
            }
        }
    }

    // Education level could be checked similarly, but omitted for brevity if 'none'.
    // Assuming 'none' or missing means we pass.
    if (hardGates.requiredEducationLevel && hardGates.requiredEducationLevel !== 'none') {
        const reqLevel = hardGates.requiredEducationLevel.toLowerCase();
        const hasEducation = parsedData.education?.some(edu =>
            (edu.level || '').toLowerCase() === reqLevel || (edu.degree || '').toLowerCase().includes(reqLevel)
        );
        if (!hasEducation) {
            return { passed: false, reason: `Does not meet required education level: ${reqLevel}` };
        }
    }

    return { passed: true };
}

/** Compute Skill Score (0-100) */
export function SkillScore(candidateSkills: string[] | undefined, requiredSkills: string[] | undefined): number {
    if (!requiredSkills || requiredSkills.length === 0) return 100;
    if (!candidateSkills || candidateSkills.length === 0) return 0;

    const reqLower = requiredSkills.map(s => s.toLowerCase());
    const candLower = candidateSkills.map(s => s.toLowerCase());

    const matchCount = reqLower.filter(s => candLower.includes(s)).length;
    return Math.min(100, Math.round((matchCount / reqLower.length) * 100));
}

/** Compute Experience Score (0-100) based on target years */
export function ExperienceScore(experience: IResumeParsedData['experience'], targetYears: number): number {
    if (!targetYears || targetYears <= 0) return 100;
    if (!experience || experience.length === 0) return 0;

    let totalMonths = 0;
    experience.forEach(exp => {
        totalMonths += exp.durationMonths || 0;
    });

    const totalYears = totalMonths / 12;
    if (totalYears >= targetYears) return 100;
    return Math.round((totalYears / targetYears) * 100);
}

/** Compute Project Score (0-100) */
export function ProjectScore(projects: IResumeParsedData['projects']): number {
    if (!projects || projects.length === 0) return 0;
    // Simple heuristic: up to 3 projects, 33 score each, to max 100
    return Math.min(100, projects.length * 33);
}

/** Compute Education Score (0-100) */
export function EducationScore(education: IResumeParsedData['education']): number {
    if (!education || education.length === 0) return 0;
    // Simple heuristic: presence of any education yields base score, degrees give more
    const levels = education.map(e => (e.level || e.degree || '').toLowerCase());

    if (levels.some(l => l.includes('phd') || l.includes('doctorate'))) return 100;
    if (levels.some(l => l.includes('master') || l.includes('ms') || l.includes('ma'))) return 85;
    if (levels.some(l => l.includes('bachelor') || l.includes('bs') || l.includes('ba'))) return 70;

    return 50;
}

/** Compute Bonus Score (0-100) */
export function BonusScore(parsedData: IResumeParsedData | undefined): number {
    if (!parsedData) return 0;
    let score = 0;
    if (parsedData.projects && parsedData.projects.length > 3) score += 50;
    if (parsedData.skills && parsedData.skills.length > 10) score += 50;
    return Math.min(100, score);
}

/** Compute Final Weighted Score (0-100) */
export function FinalWeightedScore(breakdown: IScoreBreakdown, weights: ScoreConfig['weights']): number {
    const totalWeight = weights.skillWeight + weights.experienceWeight + weights.projectWeight + weights.educationWeight + weights.bonusWeight;

    if (totalWeight === 0) return 0;

    const weightedScore = (
        (breakdown.skillScore * weights.skillWeight) +
        (breakdown.experienceScore * weights.experienceWeight) +
        (breakdown.projectScore * weights.projectWeight) +
        (breakdown.educationScore * weights.educationWeight) +
        (breakdown.bonusScore * weights.bonusWeight)
    ) / totalWeight;

    return Math.round(weightedScore);
}

/** Compute Confidence Score (0-100) */
export function ConfidenceScore(parsedData: IResumeParsedData | undefined): number {
    if (!parsedData) return 0;

    let confidence = 100;
    // Reduce confidence if critical sections are missing
    if (!parsedData.experience || parsedData.experience.length === 0) confidence -= 25;
    if (!parsedData.education || parsedData.education.length === 0) confidence -= 25;
    if (!parsedData.skills || parsedData.skills.length === 0) confidence -= 25;

    return Math.max(0, confidence);
}

/** Orchestrate breakdown generation */
export function generateScoreBreakdown(parsedData: IResumeParsedData | undefined, config: ScoreConfig): IScoreBreakdown {
    return {
        skillScore: SkillScore(parsedData?.skills, config.hardGates.minimumSkills),
        experienceScore: ExperienceScore(parsedData?.experience, config.hardGates.minimumExperienceYears || 0),
        projectScore: ProjectScore(parsedData?.projects),
        educationScore: EducationScore(parsedData?.education),
        bonusScore: BonusScore(parsedData)
    };
}
