import 'dotenv/config'
import { connectMongoDB, disconnectMongoDB } from '../src/database/mongodb.js'
import { Organization, User, Job, Candidate, JobApplication, RoundType, ApplicationStatus } from '../src/database/models/index.js'
import { Interview, InterviewType } from '../src/database/models/interview.models.js'
import { interviewService } from '../src/modules/interviews/interviews.service.js'
import { Types } from 'mongoose'

async function verifyInterviews() {
    console.log('🚀 Starting Interview Verification')
    await connectMongoDB()

    try {
        // 1. Setup Data: Org, User, Job, Candidate, Application
        let org = await Organization.findOne({ slug: 'acme-corp' })
        if (!org) org = await Organization.create({ name: 'Acme Corp', slug: 'acme-corp', plan: 'FREE' })

        let user = await User.findOne({ email: 'interviewer@example.com' })
        if (!user) user = await User.create({ email: 'interviewer@example.com', firstName: 'Alice', lastName: 'Wonder', onboardingCompleted: true })

        let job = await Job.findOne({ title: 'Interview Test Job' })
        if (!job) job = await Job.create({ organizationId: org._id, title: 'Interview Test Job', description: 'Desc', status: 'PUBLISHED' })

        let candidate = await Candidate.findOne({ email: 'candidate-int@example.com' })
        if (!candidate) candidate = await Candidate.create({ organizationId: org._id, email: 'candidate-int@example.com', firstName: 'Bob', lastName: 'Builder' })

        let app = await JobApplication.findOne({ candidateId: candidate._id, jobId: job._id })
        if (!app) app = await JobApplication.create({ organizationId: org._id, jobId: job._id, candidateId: candidate._id, status: ApplicationStatus.INTERVIEW })

        // 2. Schedule Interview
        console.log('Scheduling Interview...')
        const startTime = new Date()
        startTime.setDate(startTime.getDate() + 1) // Tomorrow
        const endTime = new Date(startTime)
        endTime.setHours(endTime.getHours() + 1)

        const interview = await interviewService.createInterview(org._id.toString(), {
            jobId: job._id,
            candidateId: candidate._id,
            applicationId: app._id,
            interviewerId: user._id,
            title: 'Technical Screen',
            type: InterviewType.TECHNICAL,
            startTime,
            endTime
        })
        console.log(`Interview Scheduled: ${interview._id}`)

        // 3. Submit Scorecard
        console.log('Submitting Scorecard...')
        const scorecard = await interviewService.submitScorecard(org._id.toString(), {
            interviewId: interview._id,
            applicationId: app._id,
            candidateId: candidate._id,
            interviewerId: user._id,
            overallRating: 4,
            recommendation: 'YES',
            notes: 'Strong candidate',
            sections: [
                { title: 'Coding', rating: 5, notes: 'Solved problem efficiently' },
                { title: 'Communication', rating: 3, notes: 'Good enough' }
            ]
        })
        console.log(`Scorecard Submitted: ${scorecard._id}`)

        // 4. Verify Update
        const updatedInterview = await Interview.findById(interview._id)
        if (updatedInterview?.feedbackSubmitted && updatedInterview.status === 'COMPLETED') {
            console.log('✅ Interview updated with feedback status.')
        } else {
            console.error('❌ Interview status update failed.')
        }

    } catch (error) {
        console.error('❌ Verification Failed:', error)
    } finally {
        await disconnectMongoDB()
        process.exit(0)
    }
}

verifyInterviews()
