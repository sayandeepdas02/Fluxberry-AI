import { Queue, Worker, Job } from 'bullmq'
import { Types } from 'mongoose'
import { Campaign, Message, Prospect } from '../../../database/models/prospect.models.js'
import { emailTemplateService } from '../../email/email-templates.service.js'

// Hardcoded for typical local testing / Docker setup
// In production, should come from env
const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
}

export const campaignQueue = new Queue('campaign-mailer', { connection })

interface CampaignJobData {
    campaignId: string
    prospectId: string
    organizationId: string
    templateId: string
    prospectEmail: string
    firstName: string
    lastName: string
    company: string
    role: string
}

export const campaignWorker = new Worker<CampaignJobData, any, string>('campaign-mailer', async (job: Job<CampaignJobData>) => {
    const { campaignId, prospectId, organizationId, templateId, prospectEmail, firstName, lastName, company, role } = job.data

    // 1. Idempotency Check
    let message = await Message.findOne({ campaignId, prospectId })
    if (message && message.status === 'sent') {
        return { skipped: true, reason: 'Already sent' }
    }

    if (!message) {
        message = await Message.create({
            campaignId: new Types.ObjectId(campaignId),
            prospectId: new Types.ObjectId(prospectId),
            status: 'queued',
        })
    }

    // 2. Send email
    await emailTemplateService.sendEmail(
        templateId,
        organizationId,
        prospectEmail,
        {
            firstName,
            lastName,
            company: company || '',
            role: role || '',
        }
    )

    // 3. Update Message Status
    message.status = 'sent'
    message.sentAt = new Date()
    await message.save()

    // 4. Update Prospect Status independently
    await Prospect.updateOne(
        { _id: prospectId, status: 'new' }, // Only update if still 'new'
        { $set: { status: 'contacted' } }
    )

    // 5. Update Campaign Stats Atomically
    await Campaign.updateOne(
        { _id: campaignId },
        { $inc: { 'stats.sent': 1 } }
    )

    return { success: true }
}, {
    connection,
    concurrency: 10,
    limiter: {
        max: 5,        // Max 5 emails
        duration: 1000 // per 1 second
    }
})

campaignWorker.on('failed', (job, err) => {
    console.error(`[CampaignWorker] Job skipped/failed for ${job?.data?.prospectEmail}:`, err)
})
