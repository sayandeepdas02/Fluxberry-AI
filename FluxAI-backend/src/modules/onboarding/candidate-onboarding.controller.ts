import { Request, Response, NextFunction } from 'express'
import { candidateOnboardingService } from './candidate-onboarding.service.js'
import { AuthenticatedRequest } from '../../common/guards/auth.guard.js'
import { AppError } from '../../common/errors/index.js'

export class CandidateOnboardingController {
    async getStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const { applicationId } = req.params
            const organizationId = (req as AuthenticatedRequest).user?.organizationId

            if (organizationId) {
                const { JobApplication } = await import('../../database/models/index.js')
                const app = await JobApplication.findOne({ _id: applicationId, organizationId })
                if (!app) throw AppError.notFound('Application')
            }

            const status = await candidateOnboardingService.getOnboardingStatus(applicationId)
            if (!status) throw AppError.notFound('Onboarding')
            res.success(status)
        } catch (error) {
            next(error)
        }
    }

    async updateDocument(req: Request, res: Response, next: NextFunction) {
        try {
            const { docId } = req.params
            const { status, feedback } = req.body
            const { id: userId } = (req as AuthenticatedRequest).user!
            const { doc: updatedDoc, isCompleted: onboardingCompleted } = await candidateOnboardingService.updateDocumentStatus(
                docId, status, feedback, userId
            )
            res.success({ doc: updatedDoc, onboardingCompleted })
        } catch (error) {
            next(error)
        }
    }

    async rejectForm(req: Request, res: Response, next: NextFunction) {
        try {
            const { onboardingId } = req.params
            const { feedback } = req.body
            const { organizationId } = (req as AuthenticatedRequest).user!
            if (!organizationId) throw AppError.unauthorized('Organization required')
            if (!Array.isArray(feedback)) throw AppError.badRequest('Feedback must be an array')
            const { onboardingFormService } = await import('./onboarding-form.service.js')
            const result = await onboardingFormService.rejectForm(organizationId, onboardingId, feedback)
            res.success(result)
        } catch (error) {
            next(error)
        }
    }

    async getTimeline(req: Request, res: Response, next: NextFunction) {
        try {
            const { onboardingId } = req.params
            const page = parseInt(req.query.page as string) || 1
            const limit = parseInt(req.query.limit as string) || 20
            const result = await candidateOnboardingService.getActivityTimeline(onboardingId, page, limit)
            res.success(result)
        } catch (error) {
            next(error)
        }
    }
}

export const candidateOnboardingController = new CandidateOnboardingController()
