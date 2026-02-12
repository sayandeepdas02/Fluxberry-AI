
import cron from 'node-cron'
import { EmailLog, AuditLog } from '../database/models/index.js'

// Run every day at midnight
export const startCronJobs = () => {
    console.log('⏰ Starting cron jobs...')

    cron.schedule('0 0 * * *', async () => {
        console.log('🧹 Running daily cleanup job...')
        try {
            const now = new Date()

            // 1. Delete Email Logs older than 90 days
            const emailRetentionDate = new Date(now.setDate(now.getDate() - 90))
            const emailResult = await EmailLog.deleteMany({ createdAt: { $lt: emailRetentionDate } })
            console.log(`[Cleanup] Deleted ${emailResult.deletedCount} old email logs`)

            // Reset date
            now.setTime(Date.now())

            // 2. Delete Audit Logs older than 1 year
            const auditRetentionDate = new Date(now.setFullYear(now.getFullYear() - 1))
            const auditResult = await AuditLog.deleteMany({ createdAt: { $lt: auditRetentionDate } })
            console.log(`[Cleanup] Deleted ${auditResult.deletedCount} old audit logs`)

            // Alert: Notification model might not be exported or exist in index.ts yet
            // const notificationRetentionDate = new Date(now.setDate(now.getDate() - 30))
            // const notificationResult = await Notification.deleteMany({ createdAt: { $lt: notificationRetentionDate } })
            // console.log(`[Cleanup] Deleted ${notificationResult.deletedCount} old notifications`)

        } catch (error) {
            console.error('❌ Error running cleanup job:', error)
        }
    })
}
