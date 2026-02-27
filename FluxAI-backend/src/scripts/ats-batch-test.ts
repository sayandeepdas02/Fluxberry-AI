import 'dotenv/config';
import mongoose from 'mongoose';
import { Organization, Job, Candidate } from '../database/models/index.js';
import { JobScreeningProfile } from '../modules/ats-screening/models/job-screening-profile.model.js';
import { ResumeProfile } from '../modules/ats-screening/models/resume-profile.model.js';
import { enqueueAtsScreeningJob } from '../jobs/queues/index.js';

async function batchTest() {
    console.log('🔗 Connecting to DB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fluxberry');

    const TOTAL_CANDIDATES = 1000;

    console.log(`🚀 Setting up test for ${TOTAL_CANDIDATES} candidates...`);

    // Create Organization
    const org = await Organization.create({
        name: 'Batch Test Org',
        slug: `batch-test-${Date.now()}`,
        plan: 'ENTERPRISE'
    });
    const orgId = org._id.toString();

    // Create Job
    const job = await Job.create({
        organizationId: orgId,
        title: 'Senior Engineer',
        description: 'Batch process testing',
        employmentType: 'FULL_TIME',
        status: 'PUBLISHED'
    });
    const jobId = job._id.toString();

    // Create Job Profile
    await JobScreeningProfile.create({
        jobId,
        organizationId: orgId,
        hardGates: { minimumExperienceYears: 3 },
        weights: {
            skillWeight: 0.4,
            experienceWeight: 0.3,
            projectWeight: 0.1,
            educationWeight: 0.1,
            bonusWeight: 0.1,
        }
    });

    console.log('Generating candidates in bulk...');
    const candidateDocs = [];
    const resumeDocs = [];

    // We insert in batches to avoid overwhelming mongoose
    for (let i = 0; i < TOTAL_CANDIDATES; i++) {
        const cId = new mongoose.Types.ObjectId();
        candidateDocs.push({
            _id: cId,
            organizationId: orgId,
            email: `candidate${i}_${Date.now()}@test.com`,
            firstName: `John${i}`,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // Randomize experience to test gating
        const expMonths = Math.floor(Math.random() * 60) + 12; // 1 to 6 years

        resumeDocs.push({
            candidateId: cId,
            organizationId: orgId,
            parsedAt: new Date(),
            parsedData: {
                skills: ['Node', 'TypeScript', 'React'],
                experience: [{ durationMonths: expMonths }],
                education: [{ degree: 'BSCS' }]
            },
            createdAt: new Date(),
            updatedAt: new Date()
        });
    }

    await Candidate.insertMany(candidateDocs);
    await ResumeProfile.insertMany(resumeDocs);

    console.log('Enqueuing 1000 ATS Screening Jobs...');
    let enqueued = 0;
    for (const cand of candidateDocs) {
        // Enqueue screening job (simulate CandidateApply event)
        await enqueueAtsScreeningJob({
            type: 'CANDIDATE_APPLIED',
            applicationId: new mongoose.Types.ObjectId().toString(),
            candidateId: cand._id.toString(),
            jobId,
            organizationId: orgId
        });
        enqueued++;
        if (enqueued % 100 === 0) {
            console.log(`Enqueued ${enqueued}...`);
        }
    }

    console.log('✅ Batch test initialized. Please check worker logs and DB for ScreeningResult populating.');
    process.exit(0);
}

batchTest().catch(console.error);
