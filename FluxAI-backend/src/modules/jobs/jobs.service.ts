import { Job, IJob, AuditLog, JobApplication } from '../../database/models/index.js'
import { ListJobsQuery, CreateJobInput, UpdateJobInput } from './jobs.types.js'
import { pipelineService } from './pipeline.service.js'
import crypto from 'crypto'

class JobsService {
    /**
     * Generate a unique slug for public job URLs
     */
    private generateSlug(title: string): string {
        const base = title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            .substring(0, 40)
        const suffix = crypto.randomBytes(4).toString('hex')
        return `${base}-${suffix}`
    }

    /**
     * Log an audit event
     */
    private async logAudit(params: {
        organizationId: string
        entityType: string
        entityId: string
        action: string
        previousValue?: Record<string, unknown>
        newValue?: Record<string, unknown>
        performedBy?: string
    }): Promise<void> {
        try {
            await AuditLog.create({
                organizationId: params.organizationId,
                entityType: params.entityType,
                entityId: params.entityId,
                action: params.action,
                previousValue: params.previousValue,
                newValue: params.newValue,
                performedBy: params.performedBy,
            })
        } catch (err) {
            console.error('[AuditLog] Failed to log:', err)
        }
    }

    async create(organizationId: string, input: CreateJobInput, userId?: string): Promise<IJob> {
        const job = await Job.create({
            organizationId,
            ...input,
            status: 'DRAFT',
            createdBy: userId,
        })

        // Auto-create default pipeline stages
        try {
            await pipelineService.createDefaultStages(job._id.toString(), organizationId)
        } catch (err) {
            console.error('[JobsService] Failed to create default pipeline stages:', err)
        }

        await this.logAudit({
            organizationId,
            entityType: 'JOB',
            entityId: job._id.toString(),
            action: 'CREATED',
            newValue: { title: job.title, status: job.status },
            performedBy: userId,
        })

        return job
    }

    async list(organizationId: string, query: ListJobsQuery): Promise<{ jobs: IJob[], total: number, page: number, totalPages: number }> {
        const { page = 1, limit = 20, status, search } = query
        const skip = (page - 1) * limit

        const filter: any = { organizationId }

        if (status) {
            filter.status = status
        }

        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ]
        }

        const [jobs, total] = await Promise.all([
            Job.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Job.countDocuments(filter)
        ])

        return {
            jobs,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        }
    }

    async getById(id: string, organizationId: string): Promise<IJob> {
        const job = await Job.findOne({ _id: id, organizationId })
        if (!job) {
            throw { code: 'NOT_FOUND', message: 'Job not found' }
        }
        return job
    }

    async update(id: string, organizationId: string, input: UpdateJobInput, userId?: string): Promise<IJob> {
        const existing = await Job.findOne({ _id: id, organizationId })
        if (!existing) {
            throw { code: 'NOT_FOUND', message: 'Job not found' }
        }

        if (existing.status === 'CLOSED') {
            const error = new Error('Cannot edit a closed job. Reopen it first.') as Error & { statusCode: number; code: string }
            error.statusCode = 400
            error.code = 'INVALID_STATUS'
            throw error
        }

        const previousValue = { title: existing.title, status: existing.status }

        const job = await Job.findOneAndUpdate(
            { _id: id, organizationId },
            { $set: input },
            { new: true }
        )
        if (!job) {
            throw { code: 'NOT_FOUND', message: 'Job not found' }
        }

        await this.logAudit({
            organizationId,
            entityType: 'JOB',
            entityId: id,
            action: 'UPDATED',
            previousValue,
            newValue: { title: job.title, status: job.status },
            performedBy: userId,
        })

        return job
    }

    async publish(id: string, organizationId: string, userId: string): Promise<IJob> {
        const job = await Job.findOne({ _id: id, organizationId })
        if (!job) {
            throw { code: 'NOT_FOUND', message: 'Job not found' }
        }

        if (job.status === 'PUBLISHED') {
            const error = new Error('Job is already published') as Error & { statusCode: number; code: string }
            error.statusCode = 400
            error.code = 'ALREADY_PUBLISHED'
            throw error
        }

        if (job.status === 'CLOSED') {
            const error = new Error('Cannot publish a closed job') as Error & { statusCode: number; code: string }
            error.statusCode = 400
            error.code = 'INVALID_STATUS'
            throw error
        }

        // Validate required fields for publishing
        const missing: string[] = []
        if (!job.title) missing.push('title')
        if (!job.description) missing.push('description')
        if (!job.applicationSchema || Object.keys(job.applicationSchema).length === 0) {
            missing.push('applicationSchema')
        }

        if (missing.length > 0) {
            const error = new Error(`Cannot publish: missing required fields: ${missing.join(', ')}`) as Error & { statusCode: number; code: string; details: string[] }
            error.statusCode = 400
            error.code = 'PUBLISH_VALIDATION_FAILED'
            error.details = missing
            throw error
        }

        // Generate unique slug
        let slug = this.generateSlug(job.title)
        let attempts = 0
        while (await Job.findOne({ publicSlug: slug }) && attempts < 5) {
            slug = this.generateSlug(job.title)
            attempts++
        }

        const previousStatus = job.status

        job.status = 'PUBLISHED'
        job.publicSlug = slug
        job.publishedAt = new Date()
        await job.save()

        await this.logAudit({
            organizationId,
            entityType: 'JOB',
            entityId: id,
            action: 'PUBLISHED',
            previousValue: { status: previousStatus },
            newValue: { status: 'PUBLISHED', publicSlug: slug },
            performedBy: userId,
        })

        return job
    }

    async close(id: string, organizationId: string, userId: string): Promise<IJob> {
        const job = await Job.findOne({ _id: id, organizationId })
        if (!job) {
            throw { code: 'NOT_FOUND', message: 'Job not found' }
        }

        if (job.status === 'CLOSED') {
            const error = new Error('Job is already closed') as Error & { statusCode: number; code: string }
            error.statusCode = 400
            error.code = 'ALREADY_CLOSED'
            throw error
        }

        const previousStatus = job.status

        job.status = 'CLOSED'
        job.closedAt = new Date()
        await job.save()

        await this.logAudit({
            organizationId,
            entityType: 'JOB',
            entityId: id,
            action: 'CLOSED',
            previousValue: { status: previousStatus },
            newValue: { status: 'CLOSED' },
            performedBy: userId,
        })

        return job
    }

    async softDelete(id: string, organizationId: string, userId: string): Promise<IJob> {
        const job = await Job.findOne({ _id: id, organizationId })
        if (!job) {
            throw { code: 'NOT_FOUND', message: 'Job not found' }
        }

        const previousStatus = job.status

        job.status = 'CLOSED'
        job.closedAt = new Date()
        await job.save()

        await this.logAudit({
            organizationId,
            entityType: 'JOB',
            entityId: id,
            action: 'DELETED',
            previousValue: { status: previousStatus },
            newValue: { status: 'CLOSED' },
            performedBy: userId,
        })

        return job
    }

    async getBySlug(slug: string): Promise<IJob> {
        const job = await Job.findOne({ publicSlug: slug, status: 'PUBLISHED' })
        if (!job) {
            throw { code: 'NOT_FOUND', message: 'Job not found' }
        }
        return job
    }

    async getApplicationCount(jobId: string): Promise<number> {
        return JobApplication.countDocuments({ jobId })
    }
}

export const jobsService = new JobsService()
