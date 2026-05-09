import { Job, IJob, AuditLog, JobApplication } from '../../database/models/index.js'
import { AppError } from '../../common/errors/index.js'
import { createPaginatedResponse } from '../../common/dto/pagination.dto.js'
import { ListJobsQuery, CreateJobInput, UpdateJobInput } from './jobs.types.js'
import { pipelineService } from './pipeline.service.js'
import { normalizeSkills } from '../ats-screening/scoring-v2/skill-normalizer.js'
import { enqueueRescoringJob } from '../../jobs/queues/index.js'
import { fluxEvents, DomainEvent } from '../../common/services/events.service.js'
import { activityService } from '../activity/activity.service.js'
import {
    DEFAULT_SCORING_CONFIG,
    fromLegacyProfile,
    type IScoringConfig,
} from '../ats-screening/scoring-config.types.js'
import crypto from 'crypto'

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

/**
 * Build the initial scoringConfig for a new Job.
 * Priority order: caller-provided scoringConfig > DEFAULT_SCORING_CONFIG
 * Then syncs requiredSkills and experienceRange into hardGates.
 */
function buildInitialScoringConfig(
    requiredSkills: string[],
    experienceRangeMin: number | undefined,
    overrides?: Partial<IScoringConfig>,
): IScoringConfig {
    const base: IScoringConfig = {
        ...DEFAULT_SCORING_CONFIG,
        weights:    { ...DEFAULT_SCORING_CONFIG.weights,    ...(overrides?.weights    ?? {}) },
        thresholds: { ...DEFAULT_SCORING_CONFIG.thresholds, ...(overrides?.thresholds ?? {}) },
        hardGates:  { ...DEFAULT_SCORING_CONFIG.hardGates,  ...(overrides?.hardGates  ?? {}) },
        version:    overrides?.version ?? DEFAULT_SCORING_CONFIG.version,
    }

    // Always sync job-level fields → hardGates
    base.hardGates.requiredSkills = requiredSkills
    if (experienceRangeMin != null) {
        base.hardGates.minimumExperienceYears = experienceRangeMin
    }

    return base
}

/**
 * Detect whether a job update contains field changes that would
 * materially affect ATS scoring results — requiring a re-score.
 */
function detectImpactfulChanges(
    existing: IJob,
    input: UpdateJobInput,
): { impactful: boolean; reasons: string[] } {
    const reasons: string[] = []

    // Check required skills changed
    const existingSkills = (existing.requiredSkills ?? []).map(s => s.toLowerCase()).sort()
    const newSkills = (input.requiredSkills ?? existing.requiredSkills ?? []).map(s => s.toLowerCase()).sort()
    if (JSON.stringify(existingSkills) !== JSON.stringify(newSkills)) {
        reasons.push('SKILLS_CHANGED')
    }

    // Check experience range changed
    const existingMin = existing.experienceRange?.min ?? 0
    const newMin = input.experienceRange?.min ?? existing.experienceRange?.min ?? 0
    if (existingMin !== newMin) {
        reasons.push('EXPERIENCE_CHANGED')
    }

    // Check scoring config weights changed
    if (input.scoringConfig?.weights) {
        reasons.push('WEIGHTS_CHANGED')
    }

    // Check thresholds changed
    if (input.scoringConfig?.thresholds) {
        reasons.push('THRESHOLDS_CHANGED')
    }

    return { impactful: reasons.length > 0, reasons }
}

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
        // Normalize skills before storing
        const requiredSkills = normalizeSkills(input.requiredSkills ?? [])
        const optionalSkills = normalizeSkills(input.optionalSkills ?? [])

        // Build scoringConfig — Job becomes the single source of truth
        const scoringConfig = buildInitialScoringConfig(
            requiredSkills,
            input.experienceRange?.min,
            input.scoringConfig as Partial<IScoringConfig> | undefined,
        )

        const job = await Job.create({
            organizationId,
            ...input,
            requiredSkills,
            optionalSkills,
            scoringConfig,
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

        // Activity Log for Inbox
        await activityService.log({
            organizationId,
            entityType: 'job',
            entityId: job._id.toString(),
            eventType: 'JOB_CREATED',
            actorType: 'user',
            performedBy: userId,
            metadata: { title: job.title }
        })

        return job
    }

    async list(organizationId: string, query: ListJobsQuery) {
        const { page = 1, limit = 20, status, search } = query
        const skip = (page - 1) * limit

        const filter: Record<string, unknown> = { organizationId }

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

        return createPaginatedResponse(jobs, total, page, limit)
    }

    async getById(id: string, organizationId: string): Promise<IJob> {
        const job = await Job.findOne({ _id: id, organizationId })
        if (!job) {
            throw AppError.notFound('Job')
        }
        return job
    }

    async update(id: string, organizationId: string, input: UpdateJobInput, userId?: string): Promise<IJob> {
        const existing = await Job.findOne({ _id: id, organizationId })
        if (!existing) {
            throw AppError.notFound('Job')
        }

        if (existing.status === 'CLOSED') {
            throw AppError.badRequest('Cannot edit a closed job. Reopen it first.')
        }

        const previousValue = { title: existing.title, status: existing.status }

        // Detect impactful changes BEFORE normalization (compare against existing)
        const { impactful, reasons } = detectImpactfulChanges(existing, input)

        // Normalize incoming skills
        if (input.requiredSkills) {
            input.requiredSkills = normalizeSkills(input.requiredSkills)
        }
        if (input.optionalSkills) {
            input.optionalSkills = normalizeSkills(input.optionalSkills)
        }

        // Merge & re-sync scoringConfig.hardGates
        const currentConfig = existing.scoringConfig ?? { ...DEFAULT_SCORING_CONFIG }
        const updatedRequiredSkills = input.requiredSkills ?? existing.requiredSkills ?? []
        const updatedExpMin = input.experienceRange?.min ?? existing.experienceRange?.min

        const mergedScoringConfig: IScoringConfig = {
            version:    input.scoringConfig?.version    ?? currentConfig.version    ?? 'v2',
            weights:    { ...currentConfig.weights,    ...(input.scoringConfig?.weights    ?? {}) },
            thresholds: { ...currentConfig.thresholds, ...(input.scoringConfig?.thresholds ?? {}) },
            hardGates: {
                ...currentConfig.hardGates,
                ...(input.scoringConfig?.hardGates ?? {}),
                // Always sync from Job-level fields
                requiredSkills:         updatedRequiredSkills,
                minimumExperienceYears: updatedExpMin ?? currentConfig.hardGates?.minimumExperienceYears ?? 0,
            },
        }

        const updatePayload: Record<string, unknown> = {
            ...input,
            scoringConfig: mergedScoringConfig,
        }

        const job = await Job.findOneAndUpdate(
            { _id: id, organizationId },
            { $set: updatePayload },
            { new: true }
        )
        if (!job) {
            throw AppError.notFound('Job')
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

        // Emit domain events for impactful changes
        if (impactful) {
            fluxEvents.emitDomainEvent(DomainEvent.JOB_UPDATED as any, {
                organizationId,
                jobId: id,
                reasons,
            })

            if (reasons.includes('SKILLS_CHANGED') || reasons.includes('WEIGHTS_CHANGED') || reasons.includes('THRESHOLDS_CHANGED')) {
                fluxEvents.emitDomainEvent(DomainEvent.SCORING_CONFIG_CHANGED as any, {
                    organizationId,
                    jobId: id,
                    reasons,
                })
            }

            // Trigger re-scoring for all existing candidates
            try {
                await enqueueRescoringJob({
                    type: 'RESCORE_JOB_CANDIDATES',
                    jobId: id,
                    organizationId,
                    reason: reasons.join(','),
                })
                console.log(`[JobsService] Re-scoring enqueued for job=${id} reasons=${reasons.join(',')}`)
            } catch (err) {
                // Non-critical: re-scoring failure doesn't fail the update
                console.error('[JobsService] Failed to enqueue re-scoring job:', err)
            }
        }

        return job
    }

    async publish(id: string, organizationId: string, userId: string): Promise<IJob> {
        const job = await Job.findOne({ _id: id, organizationId })
        if (!job) {
            throw AppError.notFound('Job')
        }

        if (job.status === 'PUBLISHED') {
            throw AppError.conflict('Job is already published')
        }

        if (job.status === 'CLOSED') {
            throw AppError.badRequest('Cannot publish a closed job')
        }

        const missing: string[] = []
        if (!job.title) missing.push('title')
        if (!job.description) missing.push('description')

        if (missing.length > 0) {
            throw AppError.validation(`Cannot publish: missing required fields: ${missing.join(', ')}`, missing)
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

        // Activity Log for Inbox
        await activityService.log({
            organizationId,
            entityType: 'job',
            entityId: id,
            eventType: 'JOB_PUBLISHED',
            actorType: 'user',
            performedBy: userId,
            metadata: { title: job.title, publicSlug: slug }
        })

        return job
    }

    async close(id: string, organizationId: string, userId: string): Promise<IJob> {
        const job = await Job.findOne({ _id: id, organizationId })
        if (!job) {
            throw AppError.notFound('Job')
        }

        if (job.status === 'CLOSED') {
            throw AppError.conflict('Job is already closed')
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

        // Activity Log for Inbox
        await activityService.log({
            organizationId,
            entityType: 'job',
            entityId: id,
            eventType: 'JOB_CLOSED',
            actorType: 'user',
            performedBy: userId,
            metadata: { title: job.title }
        })

        return job
    }

    async softDelete(id: string, organizationId: string, userId: string): Promise<IJob> {
        const job = await Job.findOne({ _id: id, organizationId })
        if (!job) {
            throw AppError.notFound('Job')
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
            throw AppError.notFound('Job')
        }
        return job
    }

    async getApplicationCount(jobId: string): Promise<number> {
        return JobApplication.countDocuments({ jobId })
    }
}

export const jobsService = new JobsService()
