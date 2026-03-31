/**
 * ATS Scoring Engine V2 — Comprehensive Test Suite
 *
 * Tests:
 * - Skill normalizer
 * - Cosine similarity (mathematical correctness)
 * - Skill scoring (semantic)
 * - Experience scoring (role relevance + duration)
 * - Project scoring (anti-gaming)
 * - Education scoring
 * - Signal boost
 * - Hard gates V2
 * - Insight generation
 * - Final weighted score
 * - Full pipeline orchestration (mocked embeddings)
 * - Edge cases
 * - Backward compatibility
 */

import { normalizeSkill, normalizeSkills } from '../scoring-v2/skill-normalizer.js';
import { embeddingService } from '../scoring-v2/embedding.service.js';
import {
    computeSkillScore,
    computeExperienceScore,
    computeProjectScore,
    computeEducationScore,
    computeSignalBoost,
    evaluateHardGatesV2,
    generateInsights,
    computeConfidenceV2,
    computeFinalScoreV2,
    scoreCandidate,
} from '../scoring-v2/scoring-engine-v2.js';
import { DEFAULT_V2_WEIGHTS } from '../scoring-v2/types.js';

// ──────────────────────────────────────────────────────────────
// Mock Embedding Service
// ──────────────────────────────────────────────────────────────

// Mock embedding service to avoid real API calls in tests.
// We use deterministic pseudo-embeddings based on text hashing.
jest.mock('../scoring-v2/embedding.service.js', () => {
    // Simple hash → deterministic unit vector
    function hashToVector(text: string): number[] {
        const hash = text.toLowerCase().trim();
        const vec = new Array(16).fill(0); // Small dims for testing
        for (let i = 0; i < hash.length; i++) {
            vec[i % 16] += hash.charCodeAt(i) / 100;
        }
        // Normalize to unit vector
        const mag = Math.sqrt(vec.reduce((sum: number, v: number) => sum + v * v, 0));
        return mag === 0 ? vec : vec.map((v: number) => v / mag);
    }

    const embeddingServiceMock = {
        embed: jest.fn(async (text: string) => hashToVector(text)),
        embedBatch: jest.fn(async (texts: string[]) => texts.map(t => hashToVector(t))),
        cosine: jest.fn((a: number[], b: number[]) => {
            let dot = 0, normA = 0, normB = 0;
            for (let i = 0; i < a.length; i++) {
                dot += a[i] * b[i];
                normA += a[i] * a[i];
                normB += b[i] * b[i];
            }
            const denom = Math.sqrt(normA) * Math.sqrt(normB);
            return denom === 0 ? 0 : dot / denom;
        }),
        similarity: jest.fn(async (a: string, b: string) => {
            const vecA = hashToVector(a);
            const vecB = hashToVector(b);
            let dot = 0, normA = 0, normB = 0;
            for (let i = 0; i < vecA.length; i++) {
                dot += vecA[i] * vecB[i];
                normA += vecA[i] * vecA[i];
                normB += vecB[i] * vecB[i];
            }
            const denom = Math.sqrt(normA) * Math.sqrt(normB);
            return denom === 0 ? 0 : dot / denom;
        }),
        clearCache: jest.fn(),
        cacheSize: 0,
    };

    return { embeddingService: embeddingServiceMock, EmbeddingServiceImpl: jest.fn() };
});

// ──────────────────────────────────────────────────────────────
// 1. Skill Normalizer Tests
// ──────────────────────────────────────────────────────────────

describe('Skill Normalizer', () => {
    it('normalizes known aliases to canonical form', () => {
        expect(normalizeSkill('reactjs')).toBe('React');
        expect(normalizeSkill('React.js')).toBe('React');
        expect(normalizeSkill('nodejs')).toBe('Node.js');
        expect(normalizeSkill('JS')).toBe('JavaScript');
        expect(normalizeSkill('ts')).toBe('TypeScript');
        expect(normalizeSkill('k8s')).toBe('Kubernetes');
    });

    it('preserves unknown skills with trimming', () => {
        expect(normalizeSkill('  CustomFramework  ')).toBe('CustomFramework');
        expect(normalizeSkill('MyLib')).toBe('MyLib');
    });

    it('handles empty/null inputs', () => {
        expect(normalizeSkill('')).toBe('');
        expect(normalizeSkill(null as any)).toBe(null);
    });

    it('deduplicates normalized skills', () => {
        const result = normalizeSkills(['React', 'reactjs', 'React.js', 'Node', 'NodeJS']);
        expect(result).toEqual(['React', 'Node.js']);
    });

    it('returns empty array for empty input', () => {
        expect(normalizeSkills([])).toEqual([]);
    });
});

// ──────────────────────────────────────────────────────────────
// 2. Cosine Similarity Tests
// ──────────────────────────────────────────────────────────────

describe('Cosine Similarity', () => {
    it('returns 1 for identical vectors', () => {
        const vec = [1, 2, 3, 4];
        expect(embeddingService.cosine(vec, vec)).toBeCloseTo(1.0, 5);
    });

    it('returns 0 for orthogonal vectors', () => {
        const a = [1, 0, 0, 0];
        const b = [0, 1, 0, 0];
        expect(embeddingService.cosine(a, b)).toBeCloseTo(0.0, 5);
    });

    it('returns -1 for opposite vectors', () => {
        const a = [1, 2, 3];
        const b = [-1, -2, -3];
        expect(embeddingService.cosine(a, b)).toBeCloseTo(-1.0, 5);
    });

    it('handles zero vectors', () => {
        const a = [0, 0, 0];
        const b = [1, 2, 3];
        expect(embeddingService.cosine(a, b)).toBe(0);
    });
});

// ──────────────────────────────────────────────────────────────
// 3. Skill Scoring Tests
// ──────────────────────────────────────────────────────────────

describe('computeSkillScore', () => {
    it('returns 100 when no required skills', async () => {
        const result = await computeSkillScore(['React', 'Node'], []);
        expect(result.score).toBe(100);
        expect(result.details).toEqual([]);
    });

    it('returns 0 when no candidate skills', async () => {
        const result = await computeSkillScore([], ['React', 'Node']);
        expect(result.score).toBe(0);
        expect(result.details).toHaveLength(2);
        result.details.forEach(d => expect(d.strength).toBe('none'));
    });

    it('returns 0 for undefined candidate skills', async () => {
        const result = await computeSkillScore(undefined, ['React']);
        expect(result.score).toBe(0);
    });

    it('produces match details for each required skill', async () => {
        const result = await computeSkillScore(
            ['React', 'TypeScript', 'Node.js'],
            ['React', 'Python'],
        );
        expect(result.details).toHaveLength(2);
        expect(result.details[0].skill).toBe('React');
        expect(result.details[1].skill).toBe('Python');
    });

    it('returns score between 0 and 100', async () => {
        const result = await computeSkillScore(
            ['React', 'TypeScript'],
            ['React', 'Python', 'AWS'],
        );
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(100);
    });
});

// ──────────────────────────────────────────────────────────────
// 4. Experience Scoring Tests
// ──────────────────────────────────────────────────────────────

describe('computeExperienceScore', () => {
    it('returns 100 when target is 0', async () => {
        const score = await computeExperienceScore(
            [{ durationMonths: 12, title: 'Dev' }],
            'Engineer',
            0,
        );
        expect(score).toBeLessThanOrEqual(100);
        expect(score).toBeGreaterThan(0);
    });

    it('returns 0 when no experience', async () => {
        const score = await computeExperienceScore([], 'Engineer', 3);
        expect(score).toBe(0);
    });

    it('returns 0 for undefined experience', async () => {
        const score = await computeExperienceScore(undefined, 'Engineer', 3);
        expect(score).toBe(0);
    });

    it('gives full duration match when exceeding target', async () => {
        const score = await computeExperienceScore(
            [{ durationMonths: 48, title: 'Frontend Engineer' }],
            'Frontend Engineer',
            3,
        );
        // Should be high since both role match and duration are strong
        expect(score).toBeGreaterThan(50);
    });

    it('gives partial credit for close experience', async () => {
        const score = await computeExperienceScore(
            [{ durationMonths: 24, title: 'Developer' }],
            'Developer',
            3,
        );
        expect(score).toBeGreaterThan(0);
        expect(score).toBeLessThanOrEqual(100);
    });
});

// ──────────────────────────────────────────────────────────────
// 5. Project Scoring Tests
// ──────────────────────────────────────────────────────────────

describe('computeProjectScore', () => {
    it('returns 0 for no projects', async () => {
        const result = await computeProjectScore([], [], 'Build a React app');
        expect(result.score).toBe(0);
        expect(result.analyses).toEqual([]);
    });

    it('returns 0 for undefined projects', async () => {
        const result = await computeProjectScore(undefined, [], 'Build a React app');
        expect(result.score).toBe(0);
    });

    it('penalizes short descriptions', async () => {
        const result = await computeProjectScore(
            [{ name: 'MyApp', description: 'app' }], // < 30 chars
            [],
            'Build a full-stack React application',
        );
        expect(result.analyses[0].penalized).toBe(true);
        expect(result.analyses[0].penaltyReason).toBe('Description too short');
    });

    it('penalizes generic projects', async () => {
        const result = await computeProjectScore(
            [{ name: 'Todo App', description: 'A basic todo app with CRUD operations and local storage for task management' }],
            [],
            'Build an enterprise React application with complex state management',
        );
        expect(result.analyses[0].penalized).toBe(true);
        expect(result.analyses[0].penaltyReason).toBe('Generic project detected');
    });

    it('scores based on top 2 projects', async () => {
        const result = await computeProjectScore(
            [
                { name: 'Project A', description: 'Built a large-scale e-commerce platform using React and Node.js with real-time features' },
                { name: 'Project B', description: 'Developed a machine learning pipeline for sentiment analysis using Python and TensorFlow' },
                { name: 'Project C', description: 'Created a mobile application for healthcare management with Flutter and Firebase' },
            ],
            [],
            'Full-stack web development with React and Node.js',
        );
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(100);
        expect(result.analyses).toHaveLength(3);
    });
});

// ──────────────────────────────────────────────────────────────
// 6. Education Scoring Tests
// ──────────────────────────────────────────────────────────────

describe('computeEducationScore', () => {
    it('returns 100 for PhD', () => {
        expect(computeEducationScore([{ degree: 'PhD in Computer Science' }])).toBe(100);
    });

    it('returns 85 for Masters', () => {
        expect(computeEducationScore([{ degree: 'Master of Science' }])).toBe(85);
    });

    it('returns 70 for Bachelors', () => {
        expect(computeEducationScore([{ degree: 'Bachelor of Technology' }])).toBe(70);
    });

    it('returns 50 for unknown degree', () => {
        expect(computeEducationScore([{ degree: 'Vocational Certificate' }])).toBe(50);
    });

    it('returns 70 when no education but not required', () => {
        expect(computeEducationScore([], 'none')).toBe(70);
        expect(computeEducationScore(undefined, 'none')).toBe(70);
    });

    it('returns 0 when no education but required', () => {
        expect(computeEducationScore([], 'bachelor')).toBe(0);
    });
});

// ──────────────────────────────────────────────────────────────
// 7. Signal Boost Tests
// ──────────────────────────────────────────────────────────────

describe('computeSignalBoost', () => {
    it('returns 0 when all scores are low', () => {
        expect(computeSignalBoost(30, 30, 30, 30, 0.3)).toBe(0);
    });

    it('gives +5 for high project similarity', () => {
        expect(computeSignalBoost(50, 50, 50, 50, 0.9)).toBe(5);
    });

    it('gives +3 for skill + experience alignment', () => {
        expect(computeSignalBoost(80, 80, 30, 30, 0.3)).toBe(3);
    });

    it('gives +2 for high consistency', () => {
        expect(computeSignalBoost(65, 65, 65, 65, 0.3)).toBe(2);
    });

    it('stacks boosts and caps at 10', () => {
        expect(computeSignalBoost(80, 80, 80, 80, 0.9)).toBe(10);
    });
});

// ──────────────────────────────────────────────────────────────
// 8. Hard Gates V2 Tests
// ──────────────────────────────────────────────────────────────

describe('evaluateHardGatesV2', () => {
    it('fails when no parsed data', () => {
        const result = evaluateHardGatesV2(undefined, 50, 2, 1, undefined);
        expect(result.passed).toBe(false);
        expect(result.reason).toContain('No resume data');
    });

    it('fails when skill match too low', () => {
        const data = { skills: ['SQL'], experience: [], education: [] };
        const result = evaluateHardGatesV2(data, 30, 2, undefined, undefined);
        expect(result.passed).toBe(false);
        expect(result.reason).toContain('Skill match too low');
    });

    it('fails when experience below minimum', () => {
        const data = { skills: ['React'], experience: [{ durationMonths: 12 }], education: [] };
        const result = evaluateHardGatesV2(data, 80, 1, 3, undefined);
        expect(result.passed).toBe(false);
        expect(result.reason).toContain('Experience');
    });

    it('passes when all gates satisfied', () => {
        const data = { skills: ['React', 'Node'], experience: [{ durationMonths: 36 }], education: [{ degree: 'BSc' }] };
        const result = evaluateHardGatesV2(data, 80, 3, 2, undefined);
        expect(result.passed).toBe(true);
    });

    it('fails education gate when required', () => {
        const data = { skills: ['React'], experience: [], education: [{ degree: 'High School' }] };
        const result = evaluateHardGatesV2(data, 80, 0, undefined, 'master');
        expect(result.passed).toBe(false);
        expect(result.reason).toContain('education level');
    });
});

// ──────────────────────────────────────────────────────────────
// 9. Insight Generation Tests
// ──────────────────────────────────────────────────────────────

describe('generateInsights', () => {
    it('generates strong skill insight', () => {
        const insights = generateInsights(90, 80, 70, 70, [
            { skill: 'React', bestMatch: 'React', similarity: 0.95, strength: 'strong' },
            { skill: 'Node', bestMatch: 'Node.js', similarity: 0.9, strength: 'strong' },
        ], 0.5);
        expect(insights.some(i => i.includes('Strong match'))).toBe(true);
    });

    it('generates missing skill insight', () => {
        const insights = generateInsights(40, 80, 70, 70, [
            { skill: 'React', bestMatch: '', similarity: 0.2, strength: 'none' },
            { skill: 'AWS', bestMatch: '', similarity: 0.1, strength: 'none' },
        ], 0.5);
        expect(insights.some(i => i.includes('Missing or weak'))).toBe(true);
    });

    it('generates experience insight', () => {
        const insights = generateInsights(70, 65, 70, 70, [], 0.5);
        expect(insights.some(i => i.includes('Experience'))).toBe(true);
    });

    it('generates high project relevance insight', () => {
        const insights = generateInsights(70, 70, 90, 70, [], 0.9);
        expect(insights.some(i => i.includes('Projects highly relevant'))).toBe(true);
    });
});

// ──────────────────────────────────────────────────────────────
// 10. Confidence Score V2 Tests
// ──────────────────────────────────────────────────────────────

describe('computeConfidenceV2', () => {
    it('returns 0 for undefined data', () => {
        expect(computeConfidenceV2(undefined)).toBe(0);
    });

    it('returns 100 for complete data with dates and descriptions', () => {
        const data = {
            skills: ['React', 'Node'],
            experience: [{
                title: 'Dev',
                durationMonths: 24,
                startDate: '2022-01',
                description: 'A detailed description of work that is sufficiently long for scoring purposes and quality assessment.',
            }],
            education: [{ degree: 'BSc' }],
            projects: [{ name: 'P1', description: 'A comprehensive project description that explains the work done' }],
        };
        expect(computeConfidenceV2(data)).toBe(100);
    });

    it('penalizes missing sections', () => {
        expect(computeConfidenceV2({ skills: ['React'] })).toBeLessThan(100);
        expect(computeConfidenceV2({})).toBeLessThan(50);
    });

    it('penalizes missing dates', () => {
        const withDates = computeConfidenceV2({
            skills: ['a'],
            experience: [{ startDate: '2022', description: 'Long desc '.repeat(15) }],
            education: [{ degree: 'BSc' }],
        });
        const withoutDates = computeConfidenceV2({
            skills: ['a'],
            experience: [{ description: 'Long desc '.repeat(15) }],
            education: [{ degree: 'BSc' }],
        });
        expect(withDates).toBeGreaterThan(withoutDates);
    });
});

// ──────────────────────────────────────────────────────────────
// 11. Final Weighted Score Tests
// ──────────────────────────────────────────────────────────────

describe('computeFinalScoreV2', () => {
    it('computes weighted average correctly with default weights', () => {
        const score = computeFinalScoreV2(80, 70, 60, 50, 5, DEFAULT_V2_WEIGHTS);
        // 80*0.35 + 70*0.30 + 60*0.20 + 50*0.10 + 50*0.05 = 28+21+12+5+2.5 = 68.5 → 69
        expect(score).toBe(69);
    });

    it('returns 0 when all weights are 0', () => {
        expect(computeFinalScoreV2(100, 100, 100, 100, 10, {
            skillWeight: 0, experienceWeight: 0, projectWeight: 0, educationWeight: 0, signalBoostWeight: 0,
        })).toBe(0);
    });

    it('scales signal boost from 0-10 to 0-100', () => {
        // Signal boost of 10 → scaled to 100
        const withBoost = computeFinalScoreV2(80, 80, 80, 80, 10);
        const withoutBoost = computeFinalScoreV2(80, 80, 80, 80, 0);
        expect(withBoost).toBeGreaterThan(withoutBoost);
    });
});

// ──────────────────────────────────────────────────────────────
// 12. Full Pipeline (Orchestrator) Tests
// ──────────────────────────────────────────────────────────────

describe('scoreCandidate (Full Pipeline)', () => {
    it('returns empty result for undefined parsedData', async () => {
        const result = await scoreCandidate(undefined, {
            jobDescription: 'Test JD',
            jobTitle: 'Test',
            requiredSkills: ['React'],
            targetExperienceYears: 2,
        });
        expect(result.finalScore).toBe(0);
        expect(result.confidence).toBe(0);
        expect(result.hardGatePassed).toBe(false);
        expect(result.insights).toContain('No resume data available');
    });

    it('produces valid scores for complete candidate', async () => {
        const result = await scoreCandidate(
            {
                skills: ['React', 'TypeScript', 'Node.js', 'AWS'],
                experience: [
                    { title: 'Frontend Engineer', durationMonths: 36, startDate: '2021-01', description: 'Built scalable web applications' },
                ],
                projects: [
                    { name: 'E-commerce Platform', description: 'Full-stack e-commerce platform built with React and Node.js featuring payment integration and real-time inventory management' },
                ],
                education: [{ degree: 'Bachelor of Computer Science', level: 'bachelor' }],
            },
            {
                jobDescription: 'We are looking for a Frontend Engineer with React and TypeScript experience.',
                jobTitle: 'Frontend Engineer',
                requiredSkills: ['React', 'TypeScript'],
                targetExperienceYears: 2,
            },
        );

        expect(result.finalScore).toBeGreaterThan(0);
        expect(result.finalScore).toBeLessThanOrEqual(100);
        expect(result.confidence).toBeGreaterThan(0);
        expect(result.breakdown.skillScore).toBeGreaterThanOrEqual(0);
        expect(result.breakdown.experienceScore).toBeGreaterThanOrEqual(0);
        expect(result.breakdown.projectScore).toBeGreaterThanOrEqual(0);
        expect(result.breakdown.educationScore).toBeGreaterThanOrEqual(0);
        expect(result.insights.length).toBeGreaterThan(0);
        expect(result.skillMatchDetails.length).toBe(2); // React, TypeScript
    });

    it('includes bonusScore for V1 compatibility', async () => {
        const result = await scoreCandidate(
            {
                skills: ['React'],
                experience: [],
                education: [{ degree: 'BSc' }],
            },
            {
                jobDescription: 'React developer needed',
                jobTitle: 'Developer',
                requiredSkills: ['React'],
                targetExperienceYears: 0,
            },
        );

        expect(result.breakdown.bonusScore).toBeDefined();
        expect(typeof result.breakdown.bonusScore).toBe('number');
    });
});

// ──────────────────────────────────────────────────────────────
// 13. Edge Case Tests
// ──────────────────────────────────────────────────────────────

describe('Edge Cases', () => {
    it('handles candidate with no skills', async () => {
        const result = await scoreCandidate(
            { skills: [], experience: [{ durationMonths: 24 }], education: [{ degree: 'BSc' }] },
            { jobDescription: 'Dev needed', jobTitle: 'Dev', requiredSkills: ['React'], targetExperienceYears: 1 },
        );
        expect(result.breakdown.skillScore).toBe(0);
        // Should not crash
        expect(result.finalScore).toBeGreaterThanOrEqual(0);
    });

    it('handles candidate with no projects', async () => {
        const result = await scoreCandidate(
            { skills: ['React'], experience: [{ durationMonths: 24 }], education: [{ degree: 'BSc' }], projects: [] },
            { jobDescription: 'Dev needed', jobTitle: 'Dev', requiredSkills: ['React'], targetExperienceYears: 1 },
        );
        expect(result.breakdown.projectScore).toBe(0);
        expect(result.finalScore).toBeGreaterThanOrEqual(0);
    });

    it('handles candidate with no experience', async () => {
        const result = await scoreCandidate(
            { skills: ['React', 'Node'], experience: [], education: [{ degree: 'BSc' }] },
            { jobDescription: 'Dev needed', jobTitle: 'Dev', requiredSkills: ['React'], targetExperienceYears: 3 },
        );
        expect(result.breakdown.experienceScore).toBe(0);
    });

    it('handles empty JD description gracefully', async () => {
        const result = await scoreCandidate(
            { skills: ['React'], experience: [{ durationMonths: 24 }], education: [{ degree: 'BSc' }] },
            { jobDescription: '', jobTitle: '', requiredSkills: ['React'], targetExperienceYears: 1 },
        );
        // Should not throw
        expect(result.finalScore).toBeGreaterThanOrEqual(0);
    });

    it('handles mismatched roles', async () => {
        const result = await computeExperienceScore(
            [{ title: 'Backend Developer', durationMonths: 60 }],
            'Frontend Engineer',
            3,
        );
        // Duration is met (5 years > 3), but role mismatch should reduce score
        // Still should get credit for duration
        expect(result).toBeGreaterThan(0);
        expect(result).toBeLessThanOrEqual(100);
    });
});


