import { Router } from 'express'
import { atsScreeningController } from './ats-screening.controller.js'
import { authGuard } from '../../common/guards/auth.guard.js'

const router = Router()

// All routes require authentication
router.use(authGuard)

// Endpoints (scoped by jobId, org scope implicitly handled by auth/service)
// Currently simplifying role check to active dashboard auth via authGuard
router.get(
    '/:jobId/stats',
    atsScreeningController.getJobStats
)

router.get(
    '/:jobId/candidates',
    atsScreeningController.getCandidatesList
)

router.get(
    '/:jobId/candidates/:candidateId/breakdown',
    atsScreeningController.getCandidateBreakdown
)

router.post(
    '/:jobId/candidates/:candidateId/override',
    atsScreeningController.overrideDecision
)

router.get(
    '/:jobId/profile',
    atsScreeningController.getJobProfile
)

router.put(
    '/:jobId/profile',
    atsScreeningController.updateJobProfile
)

export const atsScreeningRoutes = router
