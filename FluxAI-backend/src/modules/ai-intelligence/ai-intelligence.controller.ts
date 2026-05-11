import { Response, NextFunction } from 'express'
import { AuthenticatedRequest } from '../../common/types/request.types.js'
import { AppError } from '../../common/errors/index.js'
import { aiIntelligenceService } from './ai-intelligence.service.js'

export class AIIntelligenceController {

    async getCandidateInsights(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const orgId = req.user?.organizationId
            if (!orgId) throw AppError.forbidden('Organization context required')
            const insights = await aiIntelligenceService.getCandidateInsights(
                req.params.candidateId,
                orgId,
                req.query.jobId as string | undefined
            )
            res.success(insights)
        } catch (e) { next(e) }
    }

    async generateOutreachDraft(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const orgId = req.user?.organizationId
            if (!orgId) throw AppError.forbidden('Organization context required')
            const { jobId } = req.body
            if (!jobId) throw AppError.badRequest('jobId is required')
            const draft = await aiIntelligenceService.generateOutreachDraft(
                req.params.candidateId,
                orgId,
                jobId
            )
            res.success(draft)
        } catch (e) { next(e) }
    }

    async getRankedCandidates(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const orgId = req.user?.organizationId
            if (!orgId) throw AppError.forbidden('Organization context required')
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 20
            const ranked = await aiIntelligenceService.getRankedCandidatesForJob(req.params.jobId, orgId, limit)
            res.success(ranked)
        } catch (e) { next(e) }
    }

    async detectBottlenecks(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const orgId = req.user?.organizationId
            if (!orgId) throw AppError.forbidden('Organization context required')
            const bottlenecks = await aiIntelligenceService.detectHiringBottlenecks(orgId)
            res.success(bottlenecks)
        } catch (e) { next(e) }
    }

    async getSkillGap(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const orgId = req.user?.organizationId
            if (!orgId) throw AppError.forbidden('Organization context required')
            const { jobId } = req.query
            if (!jobId) throw AppError.badRequest('jobId query parameter required')
            const analysis = await aiIntelligenceService.getSkillGapAnalysis(
                req.params.candidateId,
                jobId as string,
                orgId
            )
            res.success(analysis)
        } catch (e) { next(e) }
    }

    async copilotChat(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const orgId = req.user?.organizationId
            if (!orgId) throw AppError.forbidden('Organization context required')
            const { messages, context } = req.body
            if (!Array.isArray(messages) || messages.length === 0)
                throw AppError.badRequest('messages array is required')
            const response = await aiIntelligenceService.recruiterCopilotChat(orgId, messages, context)
            res.success({ response })
        } catch (e) { next(e) }
    }

    async getPipelineOptimizations(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const orgId = req.user?.organizationId
            if (!orgId) throw AppError.forbidden('Organization context required')
            const result = await aiIntelligenceService.getPipelineOptimizations(req.params.jobId, orgId)
            res.success(result)
        } catch (e) { next(e) }
    }
}

export const aiIntelligenceController = new AIIntelligenceController()
