import { Job } from 'bullmq'
import { EmailLog } from '../../database/models/index.js'
import { EmailTemplate } from '../../database/models/email-template.model.js'
import { Resend } from 'resend'

export interface EmailJobData {
    to: string
    subject?: string
    html?: string
    templateId?: string
    variables?: Record<string, string>
    organizationId?: string
    metadata?: Record<string, unknown>
}

/**
 * Email processor — sends email via Resend and logs to EmailLog
 * Supports dynamic templates and tracking pixels.
 */
export async function processEmailJob(job: Job<EmailJobData>): Promise<void> {
    const { to, subject: overrideSubject, html: overrideHtml, templateId, variables, organizationId, metadata } = job.data

    let subject = overrideSubject
    let html = overrideHtml

    // 1. Render Template if ID provided
    if (templateId) {
        const template = await EmailTemplate.findById(templateId)
        if (!template) {
            throw new Error(`Email Template not found: ${templateId}`)
        }

        // Render variables
        subject = replaceVariables(template.subject, variables || {})
        html = replaceVariables(template.content, variables || {})
    }

    if (!subject || !html) {
        throw new Error('Email subject and content are required (either via override or template)')
    }

    console.log(`[Email] Sending to ${to}: ${subject}`)

    // 2. Create log entry in QUEUED state
    const emailLog = await EmailLog.create({
        organizationId,
        to,
        subject,
        template: templateId,
        status: 'QUEUED',
        metadata,
    })

    // 3. Inject Tracking Pixel
    const trackingUrl = `${process.env.API_URL || 'http://localhost:5001'}/api/tracking/pixel.png?id=${emailLog._id}`
    const trackingPixel = `<img src="${trackingUrl}" alt="" width="1" height="1" style="display:none;" />`
    const finalHtml = html + trackingPixel

    try {
        const resend = new Resend(process.env.RESEND_API_KEY)

        await resend.emails.send({
            from: process.env.EMAIL_FROM || 'Fluxberry AI <noreply@fluxberry.ai>',
            to,
            subject,
            html: finalHtml,
            // Add custom headers for tracking if needed
            headers: {
                'X-Entity-Ref-ID': emailLog._id.toString(),
            }
        })

        // 4. Update log on success
        await EmailLog.findByIdAndUpdate(emailLog._id, {
            status: 'SENT',
            sentAt: new Date(),
        })

        console.log(`[Email] ✅ Sent to ${to}`)
    } catch (err: any) {
        // 5. Update log on failure
        await EmailLog.findByIdAndUpdate(emailLog._id, {
            status: 'FAILED',
            error: err.message || 'Unknown error',
        })

        console.error(`[Email] ❌ Failed for ${to}:`, err)
        throw err
    }
}

function replaceVariables(text: string, variables: Record<string, string>): string {
    return text.replace(/{{(\w+)}}/g, (_, key) => variables[key] || '')
}
