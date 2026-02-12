import { connectMongoDB, disconnectMongoDB } from '../src/database/mongodb.js'
import { User, JobApplication, PipelineStage, Organization, Job, Candidate, ApplicationStatusType } from '../src/database/models/index.js'
import { WorkflowRule, WorkflowTrigger, ActionType, ConditionOperator } from '../src/database/models/workflow.models.js'
import { applicationsService } from '../src/modules/applications/applications.service.js'
import { Types } from 'mongoose'
import { workflowEngine } from '../src/modules/workflow/workflow.engine.js'

async function verifyWorkflow() {
    console.log('🚀 Starting Workflow Verification')
    await connectMongoDB()

    try {
        // 1. Setup Data
        let user = await User.findOne({ email: 'john@example.com' })
        if (!user) {
            console.log('User "john@example.com" not found, looking for any user...')
            user = await User.findOne({})
            if (!user) {
                console.log('No users found. Creating test user...')
                user = await User.create({
                    email: 'john@example.com',
                    passwordHash: 'hash',
                    firstName: 'John',
                    lastName: 'Doe',
                    onboardingCompleted: true
                })
            }
        }
        console.log(`Using User: ${user.email} (${user._id})`)

        let org = await Organization.findOne({ slug: 'acme-corp' })
        if (!org) {
            console.log('Organization "acme-corp" not found, looking for any organization...')
            org = await Organization.findOne({})
            if (!org) {
                console.log('No organizations found. Creating test org...')
                org = await Organization.create({
                    name: 'Acme Corp',
                    slug: 'acme-corp',
                    plan: 'FREE'
                })
            }
        }
        console.log(`Using Org: ${org.name} (${org._id})`)

        let job = await Job.findOne({ organizationId: org._id })
        if (!job) {
            console.log('No jobs found for org. Creating test job...')
            job = await Job.create({
                organizationId: org._id,
                title: 'Test Job',
                description: 'Test Description',
                status: 'PUBLISHED'
            })
        }
        console.log(`Using Job: ${job.title} (${job._id})`)

        let candidate = await Candidate.findOne({ organizationId: org._id })
        if (!candidate) {
            console.log('No candidates found. Creating test candidate...')
            candidate = await Candidate.create({
                organizationId: org._id,
                email: 'candidate@example.com',
                firstName: 'Jane',
                lastName: 'Doe'
            })
        }

        // Ensure application exists
        let application = await JobApplication.findOne({
            organizationId: org._id,
            jobId: job._id,
            candidateId: candidate._id
        })

        if (!application) {
            console.log('Creating test application...')
            application = await JobApplication.create({
                organizationId: org._id,
                jobId: job._id,
                candidateId: candidate._id,
                status: 'APPLIED',
                submittedAt: new Date()
            })
        }

        // Get stages
        let stages = await PipelineStage.find({ jobId: job._id }).sort({ order: 1 })
        if (stages.length < 2) {
            console.log('Creating default stages...')
            const s1 = await PipelineStage.create({
                jobId: job._id,
                organizationId: org._id,
                name: 'Applied',
                type: 'APPLIED',
                order: 1,
                isDefault: true
            })
            const s2 = await PipelineStage.create({
                jobId: job._id,
                organizationId: org._id,
                name: 'Interview',
                type: 'INTERVIEW',
                order: 2,
                isDefault: true
            })
            stages = [s1, s2]
        }

        const initialStage = stages[0]
        const nextStage = stages[1]

        console.log(`Initial Stage: ${initialStage.name}, Next Stage: ${nextStage.name}`)

        // Reset application to initial stage
        application.status = initialStage.type as ApplicationStatusType
        application.currentStageId = initialStage._id
        await application.save()

        // 2. Create Workflow Rule
        console.log('Creating Workflow Rule...')
        await WorkflowRule.deleteMany({ name: 'Verify Email Rule' }) // Cleanup

        const rule = await WorkflowRule.create({
            organizationId: org._id,
            name: 'Verify Email Rule',
            isActive: true,
            trigger: WorkflowTrigger.STAGE_CHANGED,
            conditions: [
                {
                    field: 'newStageId',
                    operator: ConditionOperator.EQUALS,
                    value: nextStage._id.toString()
                }
            ],
            actions: [
                {
                    type: ActionType.SEND_EMAIL,
                    config: {
                        to: 'candidate',
                        subject: 'You have moved to the next stage!',
                        body: 'Congratulations!'
                    }
                }
            ]
        })
        console.log(`Rule Created: ${rule._id}`)

        // 3. Trigger Event (Move Stage)
        console.log('Moving Stage to trigger workflow...')
        await applicationsService.moveToStage(
            application._id.toString(),
            org._id.toString(),
            nextStage._id.toString(),
            user._id.toString()
        )

        console.log('✅ Stage Moved. Workflow should be triggered asynchronously.')
        console.log('Check server logs for "🤖 Evaluating rules" and "✅ Rule Matched"')

    } catch (error) {
        console.error('❌ Verification Failed:', error)
    } finally {
        await disconnectMongoDB()
        process.exit(0)
    }
}

verifyWorkflow()
