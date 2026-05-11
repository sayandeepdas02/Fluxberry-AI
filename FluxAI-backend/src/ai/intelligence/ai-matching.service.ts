/**
 * AI Matching Service
 * Forward matching (job → candidates) and reverse matching (candidate → jobs).
 * Uses embedding similarity with deterministic fallback.
 */

import { Job as JobModel, Candidate, JobApplication } from '../../../database/models/index.js'
import { embeddingService } from '../../../modules/ats-screening/scoring-v2/embedding.service.js'
import { Types } from 'mongoose'

interface MatchResult {
    id: string
    name: string
    score: number
    confidence: number
    matchReasons: string[]
}

class AIMatchingService {

    /**
     * Match a candidate to open jobs in the organization.
     */
    async matchCandidateToJobs(candidateId: string, orgId: string): Promise<{ matches: MatchResult[] }> {
        const candidate = await Candidate.findOne({ _id: candidateId, organizationId: orgId })
            .select('firstName lastName email parsedResumeData tags')
            .lean()
        if (!candidate) throw { code: 'NOT_FOUND', message: 'Candidate not found' }

        const jobs = await JobModel.find({ organizationId: orgId, status: 'PUBLISHED', deletedAt: null })
            .select('title description requiredSkills department location')
            .limit(50)
            .lean()

        if (jobs.length === 0) return { matches: [] }

        const parsed = (candidate as any).parsedResumeData || {}
        const candidateText = [
            parsed.summary || '',
            (parsed.skills || []).join(', '),
            ((candidate as any).tags || []).join(', '),
        ].filter(Boolean).join('. ') || 'No profile data'

        try {
            const candidateEmb = await embeddingService.embed(candidateText)

            const jobTexts = jobs.map(j => [
                (j as any).title, (j as any).description?.substring(0, 300),
                ((j as any).requiredSkills || []).join(', '),
            ].filter(Boolean).join('. '))

            const jobEmbs = await embeddingService.embedBatch(jobTexts)

            const scored = jobs.map((j, i) => {
                const similarity = embeddingService.cosine(candidateEmb, jobEmbs[i])
                const skillOverlap = this.calculateSkillOverlap(parsed.skills || [], (j as any).requiredSkills || [])
                const score = Math.round((similarity * 70 + skillOverlap * 30) * 10) / 10

                return {
                    id: (j as any)._id.toString(),
                    name: (j as any).title,
                    score,
                    confidence: Math.min(95, Math.round(similarity * 100)),
                    matchReasons: this.generateMatchReasons(similarity, skillOverlap, (j as any)),
                }
            })

            scored.sort((a, b) => b.score - a.score)
            return { matches: scored.slice(0, 10) }
        } catch {
            // Deterministic fallback: skill overlap only
            return { matches: this.deterministicMatch(candidate, jobs) }
        }
    }

    /**
     * Match a job to candidates in the talent pool.
     */
    async matchJobToCandidates(jobId: string, orgId: string): Promise<{ matches: MatchResult[] }> {
        const job = await JobModel.findOne({ _id: jobId, organizationId: orgId })
            .select('title description requiredSkills optionalSkills department')
            .lean()
        if (!job) throw { code: 'NOT_FOUND', message: 'Job not found' }

        // Get candidates NOT already applied to this job
        const existingApps = await JobApplication.find({ jobId, organizationId: orgId })
            .select('candidateId').lean()
        const excludeIds = existingApps.map(a => a.candidateId)

        const candidates = await Candidate.find({
            organizationId: orgId,
            isDeleted: false,
            _id: { $nin: excludeIds },
            parsedResumeData: { $exists: true },
        })
            .select('firstName lastName email parsedResumeData tags')
            .limit(200)
            .lean()

        if (candidates.length === 0) return { matches: [] }

        const jobText = [
            (job as any).title, (job as any).description?.substring(0, 500),
            ((job as any).requiredSkills || []).join(', '),
        ].filter(Boolean).join('. ')

        try {
            const jobEmb = await embeddingService.embed(jobText)

            const candTexts = candidates.map(c => {
                const parsed = (c as any).parsedResumeData || {}
                return [parsed.summary || '', (parsed.skills || []).join(', ')].filter(Boolean).join('. ') || 'No data'
            })

            const candEmbs = await embeddingService.embedBatch(candTexts)

            const scored = candidates.map((c, i) => {
                const similarity = embeddingService.cosine(jobEmb, candEmbs[i])
                const name = `${(c as any).firstName || ''} ${(c as any).lastName || ''}`.trim() || (c as any).email
                return {
                    id: (c as any)._id.toString(),
                    name,
                    score: Math.round(similarity * 100 * 10) / 10,
                    confidence: Math.min(95, Math.round(similarity * 120)),
                    matchReasons: [`Embedding similarity: ${Math.round(similarity * 100)}%`],
                }
            })

            scored.sort((a, b) => b.score - a.score)
            return { matches: scored.slice(0, 20) }
        } catch {
            return { matches: [] }
        }
    }

    private calculateSkillOverlap(candidateSkills: string[], jobSkills: string[]): number {
        if (jobSkills.length === 0) return 50
        const normalizedCandidate = candidateSkills.map(s => s.toLowerCase().trim())
        const normalizedJob = jobSkills.map(s => s.toLowerCase().trim())
        const matches = normalizedJob.filter(js => normalizedCandidate.some(cs => cs.includes(js) || js.includes(cs)))
        return Math.round((matches.length / normalizedJob.length) * 100)
    }

    private generateMatchReasons(similarity: number, skillOverlap: number, job: any): string[] {
        const reasons: string[] = []
        if (similarity > 0.7) reasons.push('Strong profile alignment with job description')
        else if (similarity > 0.5) reasons.push('Good profile alignment')
        if (skillOverlap > 70) reasons.push(`${skillOverlap}% skill match`)
        if (job.department) reasons.push(`Department: ${job.department}`)
        return reasons.length > 0 ? reasons : ['Potential match based on available data']
    }

    private deterministicMatch(candidate: any, jobs: any[]): MatchResult[] {
        const candidateSkills = candidate.parsedResumeData?.skills || []
        return jobs.map(j => {
            const overlap = this.calculateSkillOverlap(candidateSkills, j.requiredSkills || [])
            return {
                id: j._id.toString(),
                name: j.title,
                score: overlap,
                confidence: 50,
                matchReasons: [`Skill overlap: ${overlap}% (deterministic)`],
            }
        }).sort((a, b) => b.score - a.score).slice(0, 10)
    }
}

export const aiMatchingService = new AIMatchingService()
