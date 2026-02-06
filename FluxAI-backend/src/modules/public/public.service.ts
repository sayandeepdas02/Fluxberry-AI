import { Organization } from '../../database/models/index.js'
import { jobsService } from '../jobs/jobs.service.js'

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
}

export const publicService = new PublicService()
