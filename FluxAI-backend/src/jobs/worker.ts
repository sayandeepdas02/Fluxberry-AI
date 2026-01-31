import { Worker } from 'bullmq'
import { redisConnection } from './redis.js'
import { processEvaluationJob } from './processors/evaluation.processor.js'
import { processNotificationJob } from './processors/notification.processor.js'

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
// GRACEFUL SHUTDOWN
// ============================================

async function shutdown() {
    console.log('Shutting down workers...')
    await evaluationWorker.close()
    await notificationWorker.close()
    await redisConnection.quit()
    console.log('Workers shut down gracefully')
    process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

console.log('👷 Workers started:')
console.log('   - evaluation (concurrency: 5)')
console.log('   - notification (concurrency: 3)')
