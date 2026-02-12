import {
    JobApplication, IJobApplication, Candidate, StageHistory, AuditLog,
    ApplicationStatus, ApplicationStatusType, PipelineStage
} from '../../database/models/index.js'
import { ListApplicationsQuery, UpdateStageInput, BulkUpdateInput } from './applications.types.js'
import { auditService } from '../../common/utils/audit.service.js'

class ApplicationsService {
    async list(
        jobId: string,
        organizationId: string,
        query: ListApplicationsQuery & { stageId?: string }
    ): Promise<{ applications: any[]; total: number; page: number; limit: number }> {
        const { page = 1, limit = 20, stage, stageId, search, sort = '-appliedAt' } = query
        const skip = (page - 1) * limit

        const filter: any = { jobId, organizationId, deletedAt: null }

        if (stageId) {
            filter.currentStageId = stageId
        } else if (stage) {
            filter.status = stage
        }

        // If search is provided, we need to find matching candidate IDs first
        let candidateIds: string[] | null = null
        if (search) {
            const matchingCandidates = await Candidate.find({
                organizationId,
                deletedAt: null,
                $or: [
                    { email: { $regex: search, $options: 'i' } },
                    { firstName: { $regex: search, $options: 'i' } },
                    { lastName: { $regex: search, $options: 'i' } },
                ],
            }).select('_id')
            candidateIds = matchingCandidates.map((c) => c._id.toString())
            filter.candidateId = { $in: candidateIds }
        }

        // Build sort object
        let sortObj: Record<string, 1 | -1> = { submittedAt: -1 }
        if (sort === 'appliedAt') sortObj = { submittedAt: 1 }
        else if (sort === '-appliedAt') sortObj = { submittedAt: -1 }

        const [applications, total] = await Promise.all([
            JobApplication.find(filter)
                .populate('candidateId', 'firstName lastName email phone resumeUrl')
                .populate('jobId', 'title')
                .populate('currentStageId', 'name type color order')
                .sort(sortObj)
                .skip(skip)
                .limit(limit)
                .lean(),
            JobApplication.countDocuments(filter),
        ])

        return { applications, total, page, limit }
    }

    async getById(id: string, organizationId: string): Promise<IJobApplication> {
        const application = await JobApplication.findOne({ _id: id, organizationId, deletedAt: null })
            .populate('candidateId', 'firstName lastName email phone resumeUrl')
            .populate('jobId', 'title status')
            .populate('currentStageId', 'name type color order')
        if (!application) {
            throw { code: 'NOT_FOUND', message: 'Application not found' }
        }
        return application
    }

    async updateStage(
        id: string,
        organizationId: string,
        input: UpdateStageInput,
        userId: string
    ): Promise<IJobApplication> {
        const application = await JobApplication.findOne({ _id: id, organizationId })
        if (!application) {
            throw { code: 'NOT_FOUND', message: 'Application not found' }
        }

        const previousStage = application.status
        const newStage = input.stage as ApplicationStatusType

        if (previousStage === newStage) {
            throw { code: 'VALIDATION_ERROR', message: 'Application is already in this stage' }
        }

        // Update application status
        application.status = newStage
        await application.save()

        // Create stage history entry
        await StageHistory.create({
            applicationId: application._id,
            organizationId,
            fromStage: previousStage,
            toStage: newStage,
            changedBy: userId,
        })

        // Create audit log via centralized service
        await auditService.logStageMove({
            organizationId,
            applicationId: application._id.toString(),
            fromStage: previousStage,
            toStage: newStage,
            performedBy: userId,
        })

        return application
    }

    /**
     * Move application to a pipeline stage by stage ID
     */
    async moveToStage(
        applicationId: string,
        organizationId: string,
        stageId: string,
        userId: string
    ): Promise<IJobApplication> {
        const application = await JobApplication.findOne({ _id: applicationId, organizationId })
        if (!application) {
            throw { code: 'NOT_FOUND', message: 'Application not found' }
        }

        // Validate the target stage exists and belongs to this job
        const targetStage = await PipelineStage.findOne({ _id: stageId, jobId: application.jobId })
        if (!targetStage) {
            throw { code: 'VALIDATION_ERROR', message: 'Target stage not found for this job' }
        }

        const previousStage = application.status
        const previousStageId = application.currentStageId

        // Calculate time in previous stage
        let timeInStageMs: number | undefined
        if (previousStageId) {
            const lastHistory = await StageHistory.findOne({
                applicationId: application._id,
            }).sort({ changedAt: -1 })
            if (lastHistory) {
                timeInStageMs = Date.now() - lastHistory.changedAt.getTime()
            }
        }

        // Update application
        application.status = targetStage.type as ApplicationStatusType
        application.currentStageId = targetStage._id
        await application.save()

        // Create stage history with stage IDs
        await StageHistory.create({
            applicationId: application._id,
            organizationId,
            fromStage: previousStage,
            toStage: targetStage.type,
            fromStageId: previousStageId || undefined,
            toStageId: targetStage._id,
            timeInStageMs,
            changedBy: userId,
        })

        // Audit log
        await auditService.logStageMove({
            organizationId,
            applicationId: application._id.toString(),
            fromStage: previousStage,
            toStage: targetStage.name,
            performedBy: userId,
        })

        // Emit domain event for workflows
        const { fluxEvents, DomainEvent } = await import('../../common/services/events.service.js')
        fluxEvents.emitDomainEvent(DomainEvent.STAGE_CHANGED, {
            organizationId,
            entityId: application._id.toString(),
            entityType: 'APPLICATION',
            previousStageId,
            newStageId: targetStage._id,
        })

        return this.getById(applicationId, organizationId)
    }

    /**
     * Bulk move applications to a pipeline stage
     */
    async bulkMoveToStage(
        organizationId: string,
        applicationIds: string[],
        stageId: string,
        userId: string
    ): Promise<{ updated: number; errors: string[] }> {
        const errors: string[] = []
        let updated = 0

        for (const appId of applicationIds) {
            try {
                await this.moveToStage(appId, organizationId, stageId, userId)
                updated++
            } catch (err: any) {
                errors.push(`${appId}: ${err.message || 'failed to move'}`)
            }
        }

        return { updated, errors }
    }

    /**
     * Get stage history for an application
     */
    async getStageHistory(
        applicationId: string,
        organizationId: string
    ): Promise<any[]> {
        const history = await StageHistory.find({ applicationId, organizationId })
            .populate('changedBy', 'firstName lastName email')
            .populate('fromStageId', 'name type color')
            .populate('toStageId', 'name type color')
            .sort({ changedAt: -1 })
            .lean()

        return history
    }

    async bulkUpdate(
        organizationId: string,
        input: BulkUpdateInput,
        userId: string
    ): Promise<{ updated: number; errors: string[] }> {
        const { applicationIds, action, stage } = input
        const errors: string[] = []
        let updated = 0

        // Validate all applications belong to this org
        const applications = await JobApplication.find({
            _id: { $in: applicationIds },
            organizationId,
        })

        if (applications.length !== applicationIds.length) {
            const foundIds = new Set(applications.map((a) => a._id.toString()))
            const missing = applicationIds.filter((id) => !foundIds.has(id))
            throw {
                code: 'VALIDATION_ERROR',
                message: `Applications not found or not in org: ${missing.join(', ')}`,
            }
        }

        const targetStage: ApplicationStatusType =
            action === 'REJECT'
                ? ApplicationStatus.REJECTED
                : (stage as ApplicationStatusType)

        // Process each application
        for (const app of applications) {
            try {
                if (app.status === targetStage) {
                    errors.push(`${app._id}: already in stage ${targetStage}`)
                    continue
                }

                const previousStage = app.status

                app.status = targetStage
                await app.save()

                // Create stage history
                await StageHistory.create({
                    applicationId: app._id,
                    organizationId,
                    fromStage: previousStage,
                    toStage: targetStage,
                    changedBy: userId,
                })

                // Create audit log via centralized service
                await auditService.logStageMove({
                    organizationId,
                    applicationId: app._id.toString(),
                    fromStage: previousStage,
                    toStage: targetStage,
                    performedBy: userId,
                })

                updated++
            } catch (err) {
                errors.push(`${app._id}: failed to update`)
            }
        }

        return { updated, errors }
    }

    async getStageDistribution(
        jobId: string,
        organizationId: string
    ): Promise<Record<string, number>> {
        const pipeline = await JobApplication.aggregate([
            { $match: { jobId: { $exists: true }, organizationId: { $exists: true } } },
            {
                $match: {
                    jobId: new (await import('mongoose')).default.Types.ObjectId(jobId),
                    organizationId: new (await import('mongoose')).default.Types.ObjectId(organizationId),
                },
            },
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ])

        const distribution: Record<string, number> = {}
        for (const stage of Object.values(ApplicationStatus)) {
            distribution[stage] = 0
        }
        for (const item of pipeline) {
            distribution[item._id] = item.count
        }
        return distribution
    }
}

export const applicationsService = new ApplicationsService()

