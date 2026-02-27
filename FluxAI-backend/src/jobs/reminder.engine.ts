import cron from 'node-cron'
import { Onboarding, Offer, ActivityLog, OrganizationOnboardingSettings } from '../database/models/index.js'
import { offersService } from '../modules/offers/offers.service.js'
import { enqueueEmailJob } from './queues/index.js'
import { redisConnection } from './redis.js'

export class ReminderEngine {

    // Check every hour
    startJobs() {
        cron.schedule('0 * * * *', async () => {
            // 1. Acquire Distributed Lock to prevent multi-instance parallel execution
            const lockAcquired = await redisConnection.set('onboarding_cron_lock', '1', 'EX', 55 * 60, 'NX')
            if (!lockAcquired) {
                console.log('Skipping Workflow Automation Cron - Lock acquired by another instance')
                return
            }

            console.log("Running Workflow Automation Cron Job (Lock Acquired)")
            try {
                await this.processOfferExpirations()
                await this.processOfferReminders()
                await this.processOnboardingReminders()
            } catch (err) {
                console.error("Cron Job Error:", err)
            } finally {
                // We keep the lock for 55 minutes to ensure no other hour-tick catches it early in clustered setups,
                // or we could delete it here. Usually, let it expire is safer to avoid drift double-executions.
            }
        })
    }

    private async getOrgSettings(orgId: string) {
        let settings = await OrganizationOnboardingSettings.findOne({ organizationId: orgId })
        if (!settings) {
            settings = await OrganizationOnboardingSettings.create({ organizationId: orgId }) // default schema values will inject
        }
        return settings
    }

    private async processOfferExpirations() {
        const now = new Date()
        const expiredOffers = await Offer.find({
            status: { $in: ['SENT', 'VIEWED'] },
            expiresAt: { $lt: now }
        })

        for (const offer of expiredOffers) {
            await offersService.expireOffer(offer._id.toString(), offer.organizationId.toString())
        }
    }

    private async processOfferReminders() {
        const now = new Date()

        const pendingOffers = await Offer.find({
            status: { $in: ['SENT', 'VIEWED'] }
        })

        for (const offer of pendingOffers) {
            const orgSettings = await this.getOrgSettings(offer.organizationId.toString())
            const cutoff = new Date(now.getTime() - (orgSettings.offerReminderHours * 60 * 60 * 1000))

            if (offer.createdAt < cutoff) {
                // Time has passed the organization's cutoff length
                const hasReminder = await ActivityLog.findOne({
                    entityType: 'OFFER',
                    entityId: offer._id,
                    eventType: 'REMINDER_SENT'
                })

                if (!hasReminder) {
                    await enqueueEmailJob({
                        to: 'candidate@example.com', // In reality via candidate reference
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
    }

    private async processOnboardingReminders() {
        const now = new Date()

        const stalledOnboardings = await Onboarding.find({
            status: 'IN_PROGRESS'
        }).populate('candidateId')

        for (const onboarding of stalledOnboardings) {
            const orgSettings = await this.getOrgSettings(onboarding.organizationId.toString())
            const cutoff = new Date(now.getTime() - (orgSettings.onboardingReminderHours * 60 * 60 * 1000))

            const lastHit = onboarding.lastReminderSentAt || onboarding.startDate || now
            if (lastHit < cutoff && (onboarding.reminderCount || 0) < orgSettings.maxReminders) {

                await enqueueEmailJob({
                    to: 'candidate@example.com', // Populate from candidate inside app
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
}

export const reminderEngine = new ReminderEngine()
