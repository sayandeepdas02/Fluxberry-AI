import { Worker } from 'bullmq'
import { redisConnection } from './redis.js'
import { processEvaluationJob } from './processors/evaluation.processor.js'
import { processNotificationJob } from './processors/notification.processor.js'
import { processAIInterviewJob } from './processors/ai-interview.processor.js'

console.log('🚀 Starting FluxAI Worker...')

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
// GRACEFUL SHUTDOWN
// ============================================

async function shutdown() {
    console.log('Shutting down workers...')
    await evaluationWorker.close()
    await notificationWorker.close()
    await aiInterviewWorker.close()
    await offerExpiryWorker.close()
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

