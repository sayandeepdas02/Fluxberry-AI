import { Router } from 'express'
import { onboardingController } from './onboarding.controller.js'
import { authGuard } from '../../common/guards/auth.guard.js'

const router = Router()

// All routes require authentication
router.use(authGuard)

// POST /api/onboarding/complete - Complete onboarding
router.post('/complete', onboardingController.complete.bind(onboardingController))

export default router
