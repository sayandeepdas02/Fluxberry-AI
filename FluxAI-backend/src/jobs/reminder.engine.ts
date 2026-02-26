import cron from 'node-cron'
import { Onboarding, Offer, ActivityLog } from '../database/models/index.js'
import { offersService } from '../modules/offers/offers.service.js'
import { enqueueEmailJob } from './queues/index.js'

export class ReminderEngine {

    // Check every hour
    startJobs() {
        cron.schedule('0 * * * *', async () => {
            console.log("Running Workflow Automation Cron Job")
            try {
                await this.processOfferExpirations()
                await this.processOfferReminders()
                await this.processOnboardingReminders()
            } catch (err) {
                console.error("Cron Job Error:", err)
            }
        })
    }

    private async processOfferExpirations() {
        const now = new Date()
        const expiredOffers = await Offer.find({
            status: { $in: ['SENT', 'VIEWED'] },
            expiresAt: { $lt: now }
        })

        for (const offer of expiredOffers) {
            await offersService.expireOffer(offer.publicToken!)
        }
    }

    private async processOfferReminders() {
        // Find offers SENT or VIEWED, created > 48h ago, and no reminder sent yet (or check reminderCount/log)
        // For simplicity: created > 48h ago, reminderCount == 0 (Extend schema internally or use ActivityLog)
        const now = new Date()
        const cutoff = new Date(now.getTime() - (48 * 60 * 60 * 1000))

        // This is a simplistic check. Real implementation would use lastReminderSentAt and reminderCount
        const offersToRemind = await Offer.find({
            status: { $in: ['SENT', 'VIEWED'] },
            createdAt: { $lt: cutoff }
            // Let's assume we aren't tracking offer reminder count at the schema level right now, 
            // but we can track via ActivityLog to prevent spam.
        })

        for (const offer of offersToRemind) {
            const hasReminder = await ActivityLog.findOne({
                entityType: 'OFFER',
                entityId: offer._id,
                eventType: 'REMINDER_SENT'
            })

            if (!hasReminder) {
                // Send reminder email
                await enqueueEmailJob({
                    to: 'candidate@example.com', // Get from application
                    subject: 'Reminder: Action Required on Your Offer',
                    html: `<p>Please review and sign your offer before it expires.</p>`
                })

                await ActivityLog.create({
                    entityType: 'OFFER',
                    entityId: offer._id,
                    eventType: 'REMINDER_SENT',
                    timestamp: new Date()
                })
            }
        }
    }

    private async processOnboardingReminders() {
        // Find Onboardings IN_PROGRESS with no activity in 72h
        const now = new Date()
        const cutoff = new Date(now.getTime() - (72 * 60 * 60 * 1000))

        const stalledOnboardings = await Onboarding.find({
            status: 'IN_PROGRESS',
            $or: [
                { lastReminderSentAt: { $lt: cutoff } }, // Over 72 hrs since last reminder
                { lastReminderSentAt: { $exists: false }, startDate: { $lt: cutoff } } // Over 72 hrs since start with no reminder
            ]
        })

        for (const onboarding of stalledOnboardings) {
            // Send reminder
            await enqueueEmailJob({
                to: 'candidate@example.com', // Get candidate email
                subject: 'Reminder: Action Required on Onboarding Tasks',
                html: `<p>Please log in and complete your pending onboarding tasks.</p>`
            })

            onboarding.reminderCount = (onboarding.reminderCount || 0) + 1
            onboarding.lastReminderSentAt = new Date()
            await onboarding.save()

            await ActivityLog.create({
                entityType: 'ONBOARDING',
                entityId: onboarding._id,
                eventType: 'REMINDER_SENT',
                metadata: { count: onboarding.reminderCount },
                timestamp: new Date()
            })
        }
    }
}

export const reminderEngine = new ReminderEngine()
