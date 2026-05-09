import { Response, NextFunction } from 'express'
import { copilotService } from './copilot.service.js'
import { AuthenticatedRequest } from '../../common/guards/auth.guard.js'
import { AppError } from '../../common/errors/index.js'

export class CopilotController {
    async getInsights(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const data = await copilotService.generateCopilotInsights(req.params.jobId, req.user!.organizationId!)
            res.success(data)
        } catch (error) {
            next(error)
        }
    }

    async getCandidateSummary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const data = await copilotService.getCandidateSummary(
                req.params.jobId, req.params.candidateId, req.user!.organizationId!
            )
            res.success(data)
        } catch (error) {
            next(error)
        }
    }

    async generateQuestions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { candidateId } = req.body
            if (!candidateId) throw AppError.badRequest('candidateId is required')
            const questions = await copilotService.generateInterviewQuestions(
                req.params.jobId, candidateId, req.user!.organizationId!
            )
            res.success(questions)
        } catch (error) {
            next(error)
        }
    }

    async chat(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { messages } = req.body
            if (!messages || !Array.isArray(messages)) throw AppError.badRequest('messages array is required')
            const responseText = await copilotService.chatWithCopilot(
                req.params.jobId, req.user!.organizationId!, messages
            )
            res.success(responseText)
        } catch (error) {
            next(error)
        }
    }
}

export const copilotController = new CopilotController()
