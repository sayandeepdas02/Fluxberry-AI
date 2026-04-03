import { Types } from 'mongoose'
import { EmailTemplate, IEmailTemplate } from '../../database/models/email-template.model.js'
import { EmailLog } from '../../database/models/index.js'
import nodemailer from 'nodemailer'

// Build a transporter lazily — falls back to console log if SMTP not configured
function getTransporter() {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env
    if (!SMTP_HOST) return null
    return nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT || 587),
        secure: Number(SMTP_PORT || 587) === 465,
        auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    })
}

class EmailTemplateService {
    async create(organizationId: string, data: Partial<IEmailTemplate>): Promise<IEmailTemplate> {
        return EmailTemplate.create({
            ...data,
            organizationId: new Types.ObjectId(organizationId),
        })
    }

    async list(organizationId: string): Promise<IEmailTemplate[]> {
        return EmailTemplate.find({ organizationId: new Types.ObjectId(organizationId) })
            .sort({ createdAt: -1 })
            .lean()
    }

    async getById(id: string, organizationId: string): Promise<IEmailTemplate | null> {
        return EmailTemplate.findOne({ _id: id, organizationId: new Types.ObjectId(organizationId) })
    }

    async update(id: string, organizationId: string, data: Partial<IEmailTemplate>): Promise<IEmailTemplate | null> {
        return EmailTemplate.findOneAndUpdate(
            { _id: id, organizationId: new Types.ObjectId(organizationId) },
            { $set: data },
            { new: true }
        )
    }

    async delete(id: string, organizationId: string): Promise<boolean> {
        const result = await EmailTemplate.deleteOne({ _id: id, organizationId: new Types.ObjectId(organizationId) })
        return result.deletedCount === 1
    }

    /**
     * Send an email using a saved template.
     * Variables are replaced with Handlebars-style {{key}} substitution.
     * Falls back to console.log if SMTP is not configured.
     */
    async sendEmail(
        templateId: string,
        organizationId: string,
        to: string,
        variables: Record<string, string> = {}
    ): Promise<{ sent: boolean; preview?: string }> {
        const template = await this.getById(templateId, organizationId)
        if (!template) throw Object.assign(new Error('Template not found'), { statusCode: 404, code: 'NOT_FOUND' })

        // Simple variable substitution: {{key}} → value
        const interpolate = (text: string) =>
            text.replace(/\{\{([^}]+)\}\}/g, (_, key) => variables[key.trim()] ?? '')

        const subject = interpolate(template.subject)
        const html    = interpolate(template.content)

        // Log the attempt
        const log = await EmailLog.create({
            organizationId: new Types.ObjectId(organizationId),
            to,
            subject,
            template: template.name,
            status: 'QUEUED',
        })

        const transporter = getTransporter()
        if (transporter) {
            try {
                await transporter.sendMail({
                    from: process.env.SMTP_FROM || process.env.SMTP_USER,
                    to,
                    subject,
                    html,
                })
                await EmailLog.findByIdAndUpdate(log._id, { status: 'SENT', sentAt: new Date() })
                return { sent: true }
            } catch (err: any) {
                await EmailLog.findByIdAndUpdate(log._id, { status: 'FAILED', error: err.message })
                throw Object.assign(new Error(`Failed to send email: ${err.message}`), { statusCode: 500, code: 'SEND_FAILED' })
            }
        } else {
            // No SMTP configured — log to console, mark as sent for dev purposes
            console.log('[EmailService] SMTP not configured. Would send:', { to, subject, html: html.substring(0, 200) })
            await EmailLog.findByIdAndUpdate(log._id, { status: 'SENT', sentAt: new Date() })
            return { sent: true, preview: `[DEV] Email logged to console. Subject: ${subject}` }
        }
    }
}

export const emailTemplateService = new EmailTemplateService()
