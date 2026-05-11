import OpenAI from 'openai'
import { Prospect } from '../../database/models/prospect.models.js'
import { Types } from 'mongoose'

/**
 * AI Profile Enrichment Service
 * Uses GPT-4o-mini to normalize and extract structured data from raw profile imports.
 * Falls back to passthrough if OpenAI is unavailable.
 */
class EnrichmentService {
    private getClient(): OpenAI | null {
        const apiKey = process.env.OPENAI_API_KEY
        if (!apiKey) return null
        return new OpenAI({ apiKey })
    }

    /**
     * Enrich a single prospect profile with AI-extracted structured data.
     */
    async enrichProspect(prospectId: string, organizationId: string): Promise<any> {
        const prospect = await Prospect.findOne({ _id: prospectId, organizationId })
        if (!prospect) throw { code: 'NOT_FOUND', message: 'Prospect not found' }

        const client = this.getClient()
        if (!client) {
            // Deterministic fallback — mark as enriched with existing data
            prospect.enrichedAt = new Date()
            await prospect.save()
            return { enriched: false, reason: 'AI not configured' }
        }

        try {
            const profileData = {
                name: `${prospect.firstName} ${prospect.lastName}`,
                email: prospect.email,
                company: prospect.company,
                role: prospect.role,
                location: prospect.location,
                skills: prospect.skills,
                linkedin: prospect.socialProfiles?.linkedin,
                github: prospect.socialProfiles?.github,
            }

            const resp = await client.chat.completions.create({
                model: 'gpt-4o-mini',
                temperature: 0.1,
                max_tokens: 500,
                messages: [
                    {
                        role: 'system',
                        content: `You are a recruiting data enrichment assistant. Given a candidate profile, extract and normalize:
1. Estimated years of experience (number)
2. Seniority level (junior/mid/senior/lead/executive)
3. Primary skill category (e.g., "Frontend", "Backend", "Full-Stack", "Data Science", "DevOps")
4. Industry vertical (e.g., "FinTech", "HealthTech", "E-commerce")
5. A 1-sentence professional summary
Return ONLY valid JSON with keys: yearsOfExperience, seniorityLevel, primaryCategory, industry, summary. No extra text.`
                    },
                    {
                        role: 'user',
                        content: JSON.stringify(profileData),
                    },
                ],
            })

            const raw = resp.choices[0]?.message?.content?.trim() || ''
            const enrichment = JSON.parse(raw)

            prospect.enrichmentData = enrichment
            prospect.enrichedAt = new Date()
            if (enrichment.yearsOfExperience) {
                prospect.experience = enrichment.yearsOfExperience
            }
            await prospect.save()

            return { enriched: true, data: enrichment }
        } catch (error) {
            // Graceful fallback — don't fail the whole operation
            prospect.enrichedAt = new Date()
            prospect.enrichmentData = { error: 'enrichment_failed' }
            await prospect.save()
            return { enriched: false, reason: 'AI enrichment failed' }
        }
    }

    /**
     * Batch enrich prospects (queue-backed, called from processor).
     */
    async enrichBatch(prospectIds: string[], organizationId: string): Promise<{ succeeded: number; failed: number }> {
        let succeeded = 0
        let failed = 0

        for (const id of prospectIds) {
            try {
                const result = await this.enrichProspect(id, organizationId)
                if (result.enriched) succeeded++
                else failed++
            } catch {
                failed++
            }
        }

        return { succeeded, failed }
    }

    /**
     * Aggregate social profiles from multiple sources into a unified view.
     */
    async aggregateSocialProfiles(candidateId: string, organizationId: string) {
        const prospects = await Prospect.find({
            organizationId: new Types.ObjectId(organizationId),
            convertedCandidateId: new Types.ObjectId(candidateId),
        }).select('socialProfiles enrichmentData source').lean()

        const aggregated: Record<string, string> = {}
        for (const p of prospects) {
            if (p.socialProfiles?.linkedin) aggregated.linkedin = p.socialProfiles.linkedin
            if (p.socialProfiles?.github) aggregated.github = p.socialProfiles.github
            if (p.socialProfiles?.twitter) aggregated.twitter = p.socialProfiles.twitter
            if (p.socialProfiles?.portfolio) aggregated.portfolio = p.socialProfiles.portfolio
        }

        return aggregated
    }
}

export const enrichmentService = new EnrichmentService()
