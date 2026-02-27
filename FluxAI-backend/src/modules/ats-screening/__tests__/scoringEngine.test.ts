import { HardGate, SkillScore, ExperienceScore, ProjectScore, EducationScore, BonusScore, FinalWeightedScore, ConfidenceScore, generateScoreBreakdown } from '../scoringEngine.js';

describe('ATS Scoring Engine', () => {

    describe('HardGate', () => {
        it('should return false if no resume data', () => {
            const result = HardGate(undefined, {});
            expect(result.passed).toBe(false);
            expect(result.reason).toContain('No resume data');
        });

        it('should pass if no strict hard gates set', () => {
            const data = { rawText: 'test' };
            const result = HardGate(data, {});
            expect(result.passed).toBe(true);
        });

        it('should check minimum experience correctly', () => {
            const data = { experience: [{ durationMonths: 12 }, { durationMonths: 12 }], rawText: '' };
            const passResult = HardGate(data, { minimumExperienceYears: 2 });
            expect(passResult.passed).toBe(true);

            const failResult = HardGate(data, { minimumExperienceYears: 3 });
            expect(failResult.passed).toBe(false);
            expect(failResult.reason).toContain('Experience 2.0y < required 3y');
        });

        it('should check required skills correctly', () => {
            const data = { skills: ['React', 'Node'], rawText: '' };
            const passResult = HardGate(data, { minimumSkills: ['react'] });
            expect(passResult.passed).toBe(true);

            const failResult = HardGate(data, { minimumSkills: ['python'] });
            expect(failResult.passed).toBe(false);
            expect(failResult.reason).toContain('Missing required skill: python');
        });

        it('should check required education level correctly', () => {
            const data = { education: [{ degree: 'Bachelor of Science' }], rawText: '' };
            const passResult = HardGate(data, { requiredEducationLevel: 'bachelor' });
            expect(passResult.passed).toBe(true);

            const failResult = HardGate(data, { requiredEducationLevel: 'master' });
            expect(failResult.passed).toBe(false);
            expect(failResult.reason).toContain('Does not meet required education level: master');
        });
    });

    describe('SkillScore', () => {
        it('returns 100 if no required skills', () => {
            expect(SkillScore(['React'], [])).toBe(100);
            expect(SkillScore(['React'], undefined)).toBe(100);
        });

        it('returns 0 if no candidate skills but some required', () => {
            expect(SkillScore([], ['React'])).toBe(0);
            expect(SkillScore(undefined, ['React'])).toBe(0);
        });

        it('returns correct percentage of matched skills', () => {
            expect(SkillScore(['react', 'node', 'aws'], ['React', 'AWS', 'Python'])).toBe(67);
            expect(SkillScore(['react', 'node', 'aws'], ['React', 'AWS', 'Node'])).toBe(100);
            expect(SkillScore(['SQL'], ['React', 'AWS', 'Node', 'Python'])).toBe(0);
        });
    });

    describe('ExperienceScore', () => {
        it('returns 100 if target 0 or undefined', () => {
            expect(ExperienceScore([{ durationMonths: 10 }], 0)).toBe(100);
        });

        it('returns correct percentage matching target', () => {
            expect(ExperienceScore([{ durationMonths: 12 }], 2)).toBe(50);
            expect(ExperienceScore([{ durationMonths: 24 }], 2)).toBe(100);
            expect(ExperienceScore([{ durationMonths: 36 }], 2)).toBe(100); // Caps at 100
        });

        it('returns 0 if no experience', () => {
            expect(ExperienceScore([], 1)).toBe(0);
            expect(ExperienceScore(undefined, 1)).toBe(0);
        });
    });

    describe('ProjectScore', () => {
        it('scores 0 if no projects', () => {
            expect(ProjectScore([])).toBe(0);
            expect(ProjectScore(undefined)).toBe(0);
        });

        it('scores based on 33 per project up to 100', () => {
            expect(ProjectScore([{ name: 'p1' }])).toBe(33);
            expect(ProjectScore([{ name: 'p1' }, { name: 'p2' }])).toBe(66);
            expect(ProjectScore([{ name: 'p1' }, { name: 'p2' }, { name: 'p3' }])).toBe(99);
            expect(ProjectScore([{ name: 'p1' }, { name: 'p2' }, { name: 'p3' }, { name: 'p4' }])).toBe(100);
        });
    });

    describe('EducationScore', () => {
        it('scores 0 if no education', () => {
            expect(EducationScore([])).toBe(0);
        });

        it('assigns higher score to higher degrees', () => {
            expect(EducationScore([{ degree: 'Bachelor of Arts' }])).toBe(70);
            expect(EducationScore([{ degree: 'Master of Science' }])).toBe(85);
            expect(EducationScore([{ level: 'PhD' }])).toBe(100);
            expect(EducationScore([{ degree: 'High School' }])).toBe(50);
        });
    });

    describe('BonusScore', () => {
        it('adds 50 for >3 projects', () => {
            expect(BonusScore({ projects: [{}, {}, {}, {}] })).toBe(50);
        });

        it('adds 50 for >10 skills', () => {
            expect(BonusScore({ skills: Array(11).fill('s') })).toBe(50);
        });

        it('caps at 100', () => {
            expect(BonusScore({ projects: [{}, {}, {}, {}], skills: Array(11).fill('s') })).toBe(100);
        });
    });

    describe('FinalWeightedScore', () => {
        it('calculates weighted average correctly', () => {
            const breakdown = {
                skillScore: 80,
                experienceScore: 50,
                projectScore: 100,
                educationScore: 70,
                bonusScore: 0
            };
            const weights = {
                skillWeight: 0.4,
                experienceWeight: 0.3,
                projectWeight: 0.1,
                educationWeight: 0.1,
                bonusWeight: 0.1
            };
            // (80*0.4 + 50*0.3 + 100*0.1 + 70*0.1 + 0*0.1) / 1.0 = 32 + 15 + 10 + 7 + 0 = 64
            expect(FinalWeightedScore(breakdown, weights)).toBe(64);
        });

        it('handles 0 total weight', () => {
            const b = { skillScore: 100, experienceScore: 100, projectScore: 100, educationScore: 100, bonusScore: 100 };
            const w = { skillWeight: 0, experienceWeight: 0, projectWeight: 0, educationWeight: 0, bonusWeight: 0 };
            expect(FinalWeightedScore(b, w)).toBe(0);
        });
    });

    describe('ConfidenceScore', () => {
        it('returns 100 for perfect profiles', () => {
            const data = {
                experience: [{}],
                education: [{}],
                skills: ['a']
            };
            expect(ConfidenceScore(data)).toBe(100);
        });

        it('reduces 25 for each missing main component', () => {
            expect(ConfidenceScore({ education: [{}], skills: ['a'] })).toBe(75); // Missing exp
            expect(ConfidenceScore({ skills: ['a'] })).toBe(50); // Missing exp, edu
            expect(ConfidenceScore({})).toBe(25); // Missing exp, edu, skills
            expect(ConfidenceScore(undefined)).toBe(0);
        });
    });
});
