import { Router } from 'express'
import { activityController } from './activity.controller.js'
import { authGuard, requireOrganization } from '../../common/guards/auth.guard.js'

const router = Router()

// All activity routes require authentication and organization
router.use(authGuard, requireOrganization)

router.get('/', (req, res, next) => activityController.list(req, res, next))

export default router
