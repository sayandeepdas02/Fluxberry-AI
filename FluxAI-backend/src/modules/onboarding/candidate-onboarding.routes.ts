import { Router } from 'express'
import { candidateOnboardingController } from './candidate-onboarding.controller.js'
import { authGuard } from '../../common/guards/auth.guard.js'

const router = Router()

// All routes require authentication (Recruiters/Admins)
router.use(authGuard)

// Get onboarding status for a candidate/application
router.get('/application/:applicationId', candidateOnboardingController.getStatus.bind(candidateOnboardingController))

// Review/Update document status
router.patch('/document/:docId', candidateOnboardingController.updateDocument.bind(candidateOnboardingController))

export default router
