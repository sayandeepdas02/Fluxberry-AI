import { Router } from 'express'
import { authGuard } from '../../common/guards/auth.guard.js'
import { sourcingController } from './sourcing.controller.js'

const router = Router()
router.use(authGuard)

router.post('/import/linkedin', (req, res, next) => sourcingController.importLinkedIn(req, res, next))
router.post('/import/github', (req, res, next) => sourcingController.importGitHub(req, res, next))
router.post('/import/bulk', (req, res, next) => sourcingController.importBulk(req, res, next))
router.post('/deduplicate', (req, res, next) => sourcingController.deduplicate(req, res, next))
router.post('/tag-campaign', (req, res, next) => sourcingController.tagCampaign(req, res, next))
router.post('/enrich/:prospectId', (req, res, next) => sourcingController.enrichProspect(req, res, next))

export const sourcingRoutes = router
