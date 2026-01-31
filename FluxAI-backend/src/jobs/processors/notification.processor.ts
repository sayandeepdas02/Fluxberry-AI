import { Job } from 'bullmq'
import { NotificationJobData, SendInviteEmailJob } from '../queues/index.js'

// ============================================
// NOTIFICATION PROCESSOR
// ============================================

export async function processNotificationJob(job: Job<NotificationJobData>): Promise<void> {
    console.log(`📧 Processing ${job.data.type} job: ${job.id}`)

    switch (job.data.type) {
        case 'SEND_INVITE_EMAIL':
            await sendInviteEmail(job.data)
            break
        case 'SEND_RESULT_EMAIL':
            // TODO: Implement result email
            console.log('SEND_RESULT_EMAIL not yet implemented')
            break
        default:
            throw new Error(`Unknown notification job type`)
    }

    console.log(`✅ Completed ${job.data.type} job: ${job.id}`)
}

// ============================================
// EMAIL SENDERS (Placeholder)
// ============================================

async function sendInviteEmail(data: SendInviteEmailJob): Promise<void> {
    // TODO: Integrate with email service (SendGrid, SES, etc.)
    console.log(`📤 Would send invite email to ${data.candidateEmail}`)
    console.log(`   Assessment: ${data.assessmentTitle}`)
    console.log(`   Link: ${data.inviteLink}`)

    // Simulate email sending delay
    await new Promise((resolve) => setTimeout(resolve, 100))
}
