/**
 * AI Outreach Service
 * Generates personalized outreach emails using GPT-4o-mini.
 * Falls back to template-based merge when AI is unavailable.
 */

import OpenAI from 'openai'
import { Prospect } from '../../../database/models/prospect.models.js'
import { Job as JobModel } from '../../../database/models/index.js'
import { AIOutreachDraft } from '../../../database/models/ai-intelligence.models.js'
import { Types } from 'mongoose'

class AIOutreachService {
    private getClient(): OpenAI | null {
        const key = process.env.OPENAI_API_KEY
        return key ? new OpenAI({ apiKey: key }) : null
    }

    async generateOutreachDraft(prospectId: string, jobId: string, orgId: string, tone: 'professional' | 'casual' | 'enthusiastic' = 'professional') {
        const [prospect, job] = await Promise.all([
            Prospect.findOne({ _id: prospectId, organizationId: orgId }).lean(),
            JobModel.findOne({ _id: jobId, organizationId: orgId }).select('title department description requiredSkills location').lean(),
        ])
        if (!prospect) throw { code: 'NOT_FOUND', message: 'Prospect not found' }
        if (!job) throw { code: 'NOT_FOUND', message: 'Job not found' }

        const client = this.getClient()
        const prospectData = {
            name: `${prospect.firstName} ${prospect.lastName}`.trim(),
            company: prospect.company,
            role: prospect.role,
            skills: prospect.skills?.slice(0, 5),
        }
        const jobData = {
            title: (job as any).title,
            department: (job as any).department,
            location: (job as any).location,
            skills: (job as any).requiredSkills?.slice(0, 5),
        }

        let subject: string
        let body: string
        let personalizationScore: number
        let isAIGenerated: boolean

        if (client) {
            try {
                const resp = await client.chat.completions.create({
                    model: 'gpt-4o-mini',
                    temperature: 0.3,
                    max_tokens: 400,
                    messages: [
                        {
                            role: 'system',
                            content: `You are a recruiter writing a ${tone} outreach email. Write a compelling, personalized email to a potential candidate. Return JSON with keys: subject, body. The body should be 3-4 short paragraphs. No placeholders like [Company]. Use the actual data provided. Be genuine and specific.`,
                        },
                        { role: 'user', content: JSON.stringify({ prospect: prospectData, job: jobData, tone }) },
                    ],
                })
                const parsed = JSON.parse(resp.choices[0]?.message?.content?.trim() || '{}')
                subject = parsed.subject || `Exciting ${jobData.title} opportunity`
                body = parsed.body || this.deterministicBody(prospectData, jobData)
                personalizationScore = 85
                isAIGenerated = true
            } catch {
                subject = `${jobData.title} opportunity — we'd love to connect`
                body = this.deterministicBody(prospectData, jobData)
                personalizationScore = 40
                isAIGenerated = false
            }
        } else {
            subject = `${jobData.title} opportunity — we'd love to connect`
            body = this.deterministicBody(prospectData, jobData)
            personalizationScore = 40
            isAIGenerated = false
        }

        const draft = await AIOutreachDraft.create({
            prospectId: new Types.ObjectId(prospectId),
            jobId: new Types.ObjectId(jobId),
            organizationId: new Types.ObjectId(orgId),
            subject, body, tone, personalizationScore, isAIGenerated,
        })

        return draft
    }

    private deterministicBody(prospect: any, job: any): string {
        return `Hi ${prospect.name || 'there'},\n\nI came across your profile and was impressed by your background${prospect.company ? ` at ${prospect.company}` : ''}. We have an open ${job.title} position${job.department ? ` in our ${job.department} team` : ''} that I think could be a great fit for your skills.\n\n${job.skills?.length > 0 ? `We're looking for expertise in ${job.skills.join(', ')}.` : ''}\n\nWould you be open to a brief conversation to learn more?\n\nBest regards`
    }
}

export const aiOutreachService = new AIOutreachService()
