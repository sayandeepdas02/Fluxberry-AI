import { processAtsScreeningJob } from '../../../jobs/processors/ats-screening.processor.js';
import { Candidate, Organization, Job } from '../../../database/models/index.js';
import { ResumeProfile } from '../models/resume-profile.model.js';
import { JobScreeningProfile } from '../models/job-screening-profile.model.js';
import { ScreeningResult, ScreeningStatus } from '../models/screening-result.model.js';
import mongoose from 'mongoose';
import { AtsScreeningJobData } from '../../../jobs/queues/index.js';

// ─────────────────────────────────────────────────────────────────────────────
// Test Setup
// ─────────────────────────────────────────────────────────────────────────────

describe('ATS Screening Worker Integration', () => {
    let orgId: string;
    let jobId: string;
    let candidateId: string;
    let applicationId: string;

    beforeAll(async () => {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fluxberry-test');
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        await Organization.deleteMany({});
        await Job.deleteMany({});
        await Candidate.deleteMany({});
        await ResumeProfile.deleteMany({});
        await JobScreeningProfile.deleteMany({});
        await ScreeningResult.deleteMany({});

        const org = await Organization.create({ name: 'Test Org', slug: 'test-org-ats', plan: 'PRO' });
        orgId = org._id.toString();

        const j = await Job.create({
            organizationId: orgId,
            title: 'Software Engineer',
            description: 'Test Job',
            employmentType: 'FULL_TIME',
            status: 'PUBLISHED',
        });
        jobId = j._id.toString();

        const cand = await Candidate.create({
            organizationId: orgId,
            email: 'test-ts@example.com',
            firstName: 'John',
            resumeUrl: 'https://example.com/resume.pdf',
        });
        candidateId  = cand._id.toString();
        applicationId = new mongoose.Types.ObjectId().toString();

        await JobScreeningProfile.create({
            jobId,
            organizationId: orgId,
            hardGates: { minimumExperienceYears: 2 },
            weights: {
                skillWeight: 0.4,
                experienceWeight: 0.3,
                projectWeight: 0.1,
                educationWeight: 0.1,
                bonusWeight: 0.1,
            },
            thresholds: { shortlist: 80, reviewZone: 60, autoReject: 0 },
        });

        await ResumeProfile.create({
            candidateId,
            organizationId: orgId,
            parsedAt: new Date(),
            parsedData: {
                experience: [{ durationMonths: 36 }],
                skills: ['React', 'Node'],
                education: [{ degree: 'BSCS' }],
            },
        });
    });

    // ── Helper ───────────────────────────────────────────────────────────────

    function buildMockJob(overrides: Partial<{ attemptsMade: number; attempts: number }> = {}) {
        return {
            id: new mongoose.Types.ObjectId().toString(),
            attemptsMade: overrides.attemptsMade ?? 0,
            opts: { attempts: overrides.attempts ?? 5 },
            data: {
                type: 'CANDIDATE_APPLIED',
                applicationId,
                candidateId,
                jobId,
                organizationId: orgId,
            } as AtsScreeningJobData,
        } as any;
    }

    // ── Scenario 1: Happy path ───────────────────────────────────────────────

    it('processes application and computes scores successfully', async () => {
        await processAtsScreeningJob(buildMockJob());

        const result = await ScreeningResult.findOne({ candidateId, jobId });
        expect(result).toBeDefined();
        expect(result?.status).toBe(ScreeningStatus.PASSED);
        expect(result?.finalScore).toBeGreaterThan(0);
        expect(result?.confidenceScore).toBeGreaterThan(0);
        // statusPriority must be persisted
        expect(result?.statusPriority).toBeDefined();
        expect(result?.statusPriority).toBe(1);
    });

    // ── Scenario 2: Hard gate failure ────────────────────────────────────────

    it('fails gate if experience is below threshold', async () => {
        await ResumeProfile.findOneAndUpdate({ candidateId }, {
            parsedData: {
                experience: [{ durationMonths: 12 }],
                skills: ['React'],
                education: [{ degree: 'BSc' }],
            },
        });

        await processAtsScreeningJob(buildMockJob());

        const result = await ScreeningResult.findOne({ candidateId, jobId });
        expect(result?.status).toBe(ScreeningStatus.FAILED_GATE);
        expect(result?.hardGateFailureReason).toContain('Experience 1.0y < required 2y');
        // statusPriority for FAILED_GATE is 2
        expect(result?.statusPriority).toBe(2);
    });

    // ── Scenario 3: Resume not ready — retry not exhausted ──────────────────

    it('throws (triggers BullMQ retry) when resume not parsed and retries remain', async () => {
        // Remove the parsedAt so it looks un-parsed
        await ResumeProfile.findOneAndUpdate({ candidateId }, { $unset: { parsedAt: '' }, $set: { parsedData: undefined } });

        const mockJob = buildMockJob({ attemptsMade: 0, attempts: 5 });
        // Should throw — BullMQ will catch this and retry
        await expect(processAtsScreeningJob(mockJob)).rejects.toThrow(/Resume not parsed yet/);

        // Status should be AWAITING_PARSE, NOT scored
        const result = await ScreeningResult.findOne({ candidateId, jobId });
        expect(result?.status).toBe(ScreeningStatus.AWAITING_PARSE);
        expect(result?.finalScore).toBe(0);
        expect(result?.errorReason).toBeNull();
    });

    // ── Scenario 4: Resume not ready — retries exhausted ────────────────────

    it('sets PARSE_FAILED and does NOT score when max retries exhausted with no parsed data', async () => {
        await ResumeProfile.findOneAndUpdate({ candidateId }, { $unset: { parsedAt: '' }, $set: { parsedData: undefined } });

        // Final attempt (attemptsMade = MAX_ATTEMPTS - 1 = 4)
        const mockJob = buildMockJob({ attemptsMade: 4, attempts: 5 });
        // Should NOT throw — exits cleanly
        await expect(processAtsScreeningJob(mockJob)).resolves.toBeUndefined();

        const result = await ScreeningResult.findOne({ candidateId, jobId });
        expect(result?.status).toBe(ScreeningStatus.PARSE_FAILED);
        expect(result?.errorReason).toBe('PARSE_TIMEOUT');
        expect(result?.finalScore).toBe(0);
        // statusPriority for PARSE_FAILED is 4
        expect(result?.statusPriority).toBe(4);
    });

    // ── Scenario 5: Parsed data present but invalid format ───────────────────

    it('sets PARSE_FAILED with INVALID_FORMAT when parsedData has no skills', async () => {
        // Skills array empty — isParsedDataValid should fail
        await ResumeProfile.findOneAndUpdate({ candidateId }, {
            parsedAt: new Date(),
            parsedData: {
                skills: [],        // Empty — invalid
                experience: [{ durationMonths: 24 }],
                education: [{ degree: 'BSc' }],
            },
        });

        const mockJob = buildMockJob({ attemptsMade: 0 });
        await expect(processAtsScreeningJob(mockJob)).resolves.toBeUndefined();

        const result = await ScreeningResult.findOne({ candidateId, jobId });
        expect(result?.status).toBe(ScreeningStatus.PARSE_FAILED);
        expect(result?.errorReason).toBe('INVALID_FORMAT');
        expect(result?.finalScore).toBe(0);
    });

    // ── Scenario 6: Idempotency ───────────────────────────────────────────────

    it('is idempotent — running the same job twice produces consistent results', async () => {
        await processAtsScreeningJob(buildMockJob());
        const first = await ScreeningResult.findOne({ candidateId, jobId });

        await processAtsScreeningJob(buildMockJob());
        const second = await ScreeningResult.findOne({ candidateId, jobId });

        expect(first?.finalScore).toBe(second?.finalScore);
        expect(first?.status).toBe(second?.status);
    });
});
