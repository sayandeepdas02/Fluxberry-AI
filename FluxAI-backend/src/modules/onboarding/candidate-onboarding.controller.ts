import { Request, Response, NextFunction } from 'express'
import { candidateOnboardingService } from './candidate-onboarding.service.js'
import { AuthenticatedRequest } from '../../common/guards/auth.guard.js'

export class CandidateOnboardingController {

    async getStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const { applicationId } = req.params
            // TODO: Verify organization access for this application

            const status = await candidateOnboardingService.getOnboardingStatus(applicationId)
            if (!status) {
                res.status(404).json({ success: false, message: 'Onboarding not started' })
                return
            }

            res.json({ success: true, data: status })
        } catch (error) {
            next(error)
        }
    }

    async updateDocument(req: Request, res: Response, next: NextFunction) {
        try {
            const { docId } = req.params
            const { status, feedback } = req.body
            const { id: userId } = (req as AuthenticatedRequest).user!

            const doc = await candidateOnboardingService.updateDocumentStatus(
                docId,
                status,
                feedback,
                userId
            )

            // Auto check completion
            const completed = await candidateOnboardingService.checkCompletion(doc.onboardingId.toString())

            res.json({ success: true, data: doc, onboardingCompleted: completed })
        } catch (error) {
            next(error)
        }
    }
}

export const candidateOnboardingController = new CandidateOnboardingController()
