import { processAtsScreeningJob } from '../../../jobs/processors/ats-screening.processor.js';
import { Candidate, Organization, Job } from '../../../database/models/index.js';
import { ResumeProfile } from '../models/resume-profile.model.js';
import { JobScreeningProfile } from '../models/job-screening-profile.model.js';
import { ScreeningResult } from '../models/screening-result.model.js';
import mongoose from 'mongoose';
import { AtsScreeningJobData } from '../../../jobs/queues/index.js';

describe('ATS Screening Worker Integration', () => {
    let orgId: string;
    let jobId: string;
    let candidateId: string;

    beforeAll(async () => {
        // Connect to test DB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fluxberry-test');
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        // Clear DB
        await Organization.deleteMany({});
        await Job.deleteMany({});
        await Candidate.deleteMany({});
        await ResumeProfile.deleteMany({});
        await JobScreeningProfile.deleteMany({});
        await ScreeningResult.deleteMany({});

        // Create mock data
        const org = await Organization.create({ name: 'Test Org', slug: 'test-org-ats', plan: 'PRO' });
        orgId = org._id.toString();

        const j = await Job.create({
            organizationId: orgId,
            title: 'Software Engineer',
            description: 'Test Job',
            employmentType: 'FULL_TIME',
            status: 'PUBLISHED'
        });
        jobId = j._id.toString();

        const cand = await Candidate.create({
            organizationId: orgId,
            email: 'test-ts@example.com',
            firstName: 'John',
            resumeUrl: 'https://example.com/resume.pdf'
        });
        candidateId = cand._id.toString();

        // Setup profiles
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
            }
        });

        await ResumeProfile.create({
            candidateId,
            organizationId: orgId,
            parsedAt: new Date(),
            parsedData: {
                experience: [{ durationMonths: 36 }],
                skills: ['React', 'Node'],
                education: [{ degree: 'BSCS' }]
            }
        });
    });

    it('processes application and computes scores successfully', async () => {
        const mockJob = {
            id: '1',
            attemptsMade: 0,
            opts: { attempts: 3 },
            data: {
                type: 'CANDIDATE_APPLIED',
                applicationId: new mongoose.Types.ObjectId().toString(),
                candidateId,
                jobId,
                organizationId: orgId
            } as AtsScreeningJobData
        } as any;

        await processAtsScreeningJob(mockJob);

        const result = await ScreeningResult.findOne({ candidateId, jobId });
        expect(result).toBeDefined();
        expect(result?.status).toBe('PASSED');
        expect(result?.finalScore).toBeGreaterThan(0);
        expect(result?.confidenceScore).toBeGreaterThan(0);
    });

    it('fails gate if experience is below threshold', async () => {
        // Update resume to 1 year experience (threshold 2)
        await ResumeProfile.findOneAndUpdate({ candidateId }, {
            parsedData: {
                experience: [{ durationMonths: 12 }],
            }
        });

        const mockJob = {
            id: '2',
            attemptsMade: 0,
            opts: { attempts: 3 },
            data: {
                type: 'CANDIDATE_APPLIED',
                applicationId: new mongoose.Types.ObjectId().toString(),
                candidateId,
                jobId,
                organizationId: orgId
            } as AtsScreeningJobData
        } as any;

        await processAtsScreeningJob(mockJob);

        const result = await ScreeningResult.findOne({ candidateId, jobId });
        expect(result).toBeDefined();
        expect(result?.status).toBe('FAILED_GATE');
        expect(result?.hardGateFailureReason).toContain('Experience 1.0y < required 2y');
    });
});
