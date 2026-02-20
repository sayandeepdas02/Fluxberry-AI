import { Job } from 'bullmq'
import { Resend } from 'resend'
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
// EMAIL SENDERS (Resend + dev fallback)
// ============================================

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Fluxberry AI <onboarding@resend.dev>'

function getInviteEmailHtml(data: SendInviteEmailJob): string {
    const greeting = data.candidateName ? `Hi ${data.candidateName},` : 'Hi,'
    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Assessment Invite</title></head>
<body style="font-family: system-ui, sans-serif; line-height: 1.6; color: #333; max-width: 560px; margin: 0 auto; padding: 20px;">
  <p>${greeting}</p>
  <p>You have been invited to take an assessment: <strong>${escapeHtml(data.assessmentTitle)}</strong>.</p>
  <p>Click the link below to start when you're ready:</p>
  <p><a href="${escapeHtml(data.inviteLink)}" style="display: inline-block; background: #111; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Start Assessment</a></p>
  <p style="font-size: 12px; color: #666;">If the button doesn't work, copy and paste this link into your browser:<br/>${escapeHtml(data.inviteLink)}</p>
  <p style="margin-top: 32px; font-size: 12px; color: #888;">This link is unique to you. Do not share it.</p>
</body>
</html>
`.trim()
}

function escapeHtml(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
}

async function sendInviteEmail(data: SendInviteEmailJob): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY

    if (!apiKey) {
        throw new Error(
            'RESEND_API_KEY is not configured. Cannot send invite email to ' + data.candidateEmail +
            '. Please add RESEND_API_KEY to your .env file and restart the worker.'
        )
    }

    // Dev/Sandbox override: Resend sandbox only allows sending to your own email
    // until a custom domain is verified at resend.com/domains.
    // Set RESEND_TEST_EMAIL=your@email.com in .env to redirect all emails there.
    const testEmail = process.env.RESEND_TEST_EMAIL
    const actualTo = testEmail || data.candidateEmail
    const isOverridden = !!testEmail && testEmail !== data.candidateEmail

    if (isOverridden) {
        console.log(`📧 [DEV OVERRIDE] Redirecting invite email for ${data.candidateEmail} → ${actualTo}`)
    } else {
        console.log(`📧 Sending invite to ${data.candidateEmail} via Resend...`)
    }

    const resend = new Resend(apiKey)
    const { data: result, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: actualTo,
        subject: isOverridden
            ? `[TEST - intended for ${data.candidateEmail}] You're invited: ${data.assessmentTitle}`
            : `You're invited: ${data.assessmentTitle}`,
        html: getInviteEmailHtml(data),
    })

    if (error) {
        console.error(`❌ Resend error for ${actualTo}:`, error)
        throw new Error(`Failed to send invite email: ${error.message}`)
    }

    console.log(`✅ Email sent to ${actualTo} (Resend ID: ${result?.id ?? 'unknown'})`)
}
