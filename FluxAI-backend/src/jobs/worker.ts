import 'dotenv/config' // ⚠️ MUST be first — loads .env before any other module reads process.env
import { Worker } from 'bullmq'
import { redisConnection } from './redis.js'
import { processEvaluationJob } from './processors/evaluation.processor.js'
import { processNotificationJob } from './processors/notification.processor.js'
import { processAIInterviewJob } from './processors/ai-interview.processor.js'
import { processResumeParsingJob } from './processors/resume-parsing.processor.js'
import { processEmailJob } from './processors/email.processor.js'
import { processAnalyticsAggregationJob } from './processors/analytics-aggregation.processor.js'
import { processWorkflowJob } from './processors/workflow.processor.js'
import { validateWorkerEnv } from '../config/env.js'

console.log('🚀 Starting Fluxberry AI Worker...')
console.log(`🔑 RESEND_API_KEY loaded: ${!!process.env.RESEND_API_KEY}`)
console.log(`🌐 FRONTEND_URL: ${process.env.FRONTEND_URL || '(not set)'}`)

// Validate all required env vars — throws and exits if any are missing
validateWorkerEnv()

// ============================================
// EVALUATION WORKER
// ============================================

const evaluationWorker = new Worker(
    'evaluation',
    async (job) => {
        await processEvaluationJob(job)
    },
    {
        connection: redisConnection,
        concurrency: 5,
        limiter: {
            max: 10,
            duration: 1000,
        },
    }
)

evaluationWorker.on('completed', (job) => {
    console.log(`✅ Evaluation job ${job.id} completed`)
})

evaluationWorker.on('failed', (job, err) => {
    console.error(`❌ Evaluation job ${job?.id} failed:`, err.message)
})

evaluationWorker.on('error', (err) => {
    console.error('Evaluation worker error:', err.message)
})

// ============================================
// NOTIFICATION WORKER
// ============================================

const notificationWorker = new Worker(
    'notification',
    async (job) => {
        await processNotificationJob(job)
    },
    {
        connection: redisConnection,
        concurrency: 3,
    }
)

notificationWorker.on('completed', (job) => {
    console.log(`✅ Notification job ${job.id} completed`)
})

notificationWorker.on('failed', (job, err) => {
    console.error(`❌ Notification job ${job?.id} failed:`, err.message)
})

notificationWorker.on('error', (err) => {
    console.error('Notification worker error:', err.message)
})

// ============================================
// AI INTERVIEW PROCESSING WORKER
// ============================================

const aiInterviewWorker = new Worker(
    'ai-interview',
    async (job) => {
        await processAIInterviewJob(job)
    },
    {
        connection: redisConnection,
        concurrency: 3,
        limiter: {
            max: 5,
            duration: 1000,
        },
    }
)

aiInterviewWorker.on('completed', (job) => {
    console.log(`✅ AI Interview job ${job.id} completed`)
})

aiInterviewWorker.on('failed', (job, err) => {
    console.error(`❌ AI Interview job ${job?.id} failed:`, err.message)
})

aiInterviewWorker.on('error', (err) => {
    console.error('AI Interview worker error:', err.message)
})

// ============================================
// OFFER EXPIRY WORKER
// ============================================
import { processOfferExpiryJob } from './processors/offer-expiry.processor.js'

const offerExpiryWorker = new Worker(
    'offer-expiry',
    async (job) => {
        await processOfferExpiryJob(job)
    },
    {
        connection: redisConnection,
        concurrency: 1, // Only need 1 worker for this cron job
    }
)

offerExpiryWorker.on('completed', (job) => {
    console.log(`✅ Offer Expiry job ${job.id} completed`)
})

offerExpiryWorker.on('failed', (job, err) => {
    console.error(`❌ Offer Expiry job ${job?.id} failed:`, err.message)
})

offerExpiryWorker.on('error', (err) => {
    console.error('Offer Expiry worker error:', err.message)
})

// ============================================
// RESUME PARSING WORKER
// ============================================

const resumeParsingWorker = new Worker(
    'resume-parsing',
    async (job) => {
        await processResumeParsingJob(job)
    },
    {
        connection: redisConnection,
        concurrency: 3,
    }
)

resumeParsingWorker.on('completed', (job) => {
    console.log(`✅ Resume Parsing job ${job.id} completed`)
})

resumeParsingWorker.on('failed', (job, err) => {
    console.error(`❌ Resume Parsing job ${job?.id} failed:`, err.message)
})

// ============================================
// EMAIL WORKER
// ============================================

const emailWorker = new Worker(
    'email',
    async (job) => {
        await processEmailJob(job)
    },
    {
        connection: redisConnection,
        concurrency: 5,
    }
)

emailWorker.on('completed', (job) => {
    console.log(`✅ Email job ${job.id} completed`)
})

emailWorker.on('failed', (job, err) => {
    console.error(`❌ Email job ${job?.id} failed:`, err.message)
})

// ============================================
// ANALYTICS AGGREGATION WORKER
// ============================================

const analyticsWorker = new Worker(
    'analytics-aggregation',
    async (job) => {
        await processAnalyticsAggregationJob(job)
    },
    {
        connection: redisConnection,
        concurrency: 1,
    }
)

analyticsWorker.on('completed', (job) => {
    console.log(`✅ Analytics job ${job.id} completed`)
})

analyticsWorker.on('failed', (job, err) => {
    console.error(`❌ Analytics job ${job?.id} failed:`, err.message)
})

// ============================================
// WORKFLOW WORKER
// ============================================

const workflowWorker = new Worker(
    'workflow',
    async (job) => {
        await processWorkflowJob(job)
    },
    {
        connection: redisConnection,
        concurrency: 5,
    }
)

workflowWorker.on('completed', (job) => {
    console.log(`✅ Workflow job ${job.id} completed`)
})

workflowWorker.on('failed', (job, err) => {
    console.error(`❌ Workflow job ${job?.id} failed:`, err.message)
})

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

async function shutdown() {
    console.log('Shutting down workers...')
    await evaluationWorker.close()
    await notificationWorker.close()
    await aiInterviewWorker.close()
    await offerExpiryWorker.close()
    await resumeParsingWorker.close()
    await emailWorker.close()
    await analyticsWorker.close()
    await workflowWorker.close()
    await redisConnection.quit()
    console.log('Workers shut down gracefully')
    process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

console.log('👷 Workers started:')
console.log('   - evaluation (concurrency: 5)')
console.log('   - notification (concurrency: 3)')
console.log('   - ai-interview (concurrency: 3)')
console.log('   - offer-expiry (concurrency: 1)')
console.log('   - resume-parsing (concurrency: 3)')
console.log('   - email (concurrency: 5)')
console.log('   - analytics-aggregation (concurrency: 1)')
console.log('   - workflow (concurrency: 5)')

