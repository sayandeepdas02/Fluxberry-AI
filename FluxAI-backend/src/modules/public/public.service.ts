import { Organization, Assessment } from '../../database/models/index.js'
import { jobsService } from '../jobs/jobs.service.js'
import { getJudge0LanguageId, runCode as judge0RunCode } from '../../services/judge0/judge0.client.js'

class PublicService {
    async getCompanyBySlug(slug: string) {
        const organization = await Organization.findOne({ slug }).select('name slug logoUrl website branding')

        if (!organization) {
            throw { code: 'NOT_FOUND', message: 'Company not found' }
        }

        return organization
    }

    async getCompanyJobs(slug: string) {
        const organization = await this.getCompanyBySlug(slug)

        const result = await jobsService.list(organization.id, {
            status: 'LIVE',
            page: 1,
            limit: 100
        })

        return result.jobs
    }

    async getJob(slug: string, jobId: string) {
        const organization = await this.getCompanyBySlug(slug)

        try {
            const job = await jobsService.getById(jobId, organization.id)
            return job
        } catch (error) {
            throw { code: 'NOT_FOUND', message: 'Job not found' }
        }
    }

    /**
     * Get public assessment details (for start page)
     */
    async getAssessment(id: string) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mongoose = await import('mongoose')
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw { code: 'INVALID_INPUT', message: 'Invalid assessment ID' }
        }

        const assessment = await Assessment.findById(id).select('title organizationId rounds status')
        if (!assessment) {
            throw { code: 'NOT_FOUND', message: 'Assessment not found' }
        }

        if (assessment.status !== 'ACTIVE') {
            throw { code: 'INVALID_STATUS', message: 'Assessment is not active' }
        }

        return {
            id: assessment._id,
            title: assessment.title,
            organizationId: assessment.organizationId,
            rounds: assessment.rounds.filter(r => r.enabled).map(r => ({
                roundType: r.roundType,
                order: r.order
            }))
        }
    }

    /**
     * Run code via Judge0 (for DSA "Run Code" in UI). No auth required; rate-limit in production.
     */
    async runCode(body: { code: string; language: string; stdin?: string }) {
        const baseUrl = process.env.JUDGE0_BASE_URL || 'http://localhost:2358'
        const languageId = getJudge0LanguageId(body.language || 'python')
        if (languageId == null) {
            throw { code: 'INVALID_INPUT', message: `Unsupported language: ${body.language}` }
        }
        const result = await judge0RunCode(
            baseUrl,
            body.code || '',
            languageId,
            body.stdin ?? '',
            {
                authToken: process.env.JUDGE0_AUTH_TOKEN || undefined,
                rapidApiKey: process.env.JUDGE0_RAPIDAPI_KEY || undefined,
                rapidApiHost: process.env.JUDGE0_RAPIDAPI_HOST || undefined,
            }
        )
        return {
            stdout: result.stdout,
            stderr: result.stderr,
            statusDescription: result.statusDescription,
            timeSeconds: result.timeSeconds,
            memoryKb: result.memoryKb,
            compileError: result.compileError,
        }
    }
}

export const publicService = new PublicService()
