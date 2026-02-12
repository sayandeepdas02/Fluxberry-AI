import { Queue } from 'bullmq'
import { redisConnection } from './redis.js'

export async function initScheduler() {
    console.log('📅 Initializing Job Scheduler...')

    // Offer Expiry Queue
    const offerExpiryQueue = new Queue('offer-expiry', {
        connection: redisConnection
    })

    // Remove existing repeatable jobs to avoid duplicates on restart/change
    const repeatableJobs = await offerExpiryQueue.getRepeatableJobs()
    for (const job of repeatableJobs) {
        await offerExpiryQueue.removeRepeatableByKey(job.key)
    }

    // Add Repeatable Job: Check every hour
    await offerExpiryQueue.add(
        'check-expired-offers',
        {}, // No data needed
        {
            repeat: {
                pattern: '0 * * * *', // Every hour at minute 0
            },
            jobId: 'check-expired-offers-cron' // Stable ID
        }
    )

    console.log('✅ Scheduled offer-expiry check (Every hour)')
}
