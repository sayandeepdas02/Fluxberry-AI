
import { Router } from 'express'
import { auditController } from './audit.controller.js'
import { authGuard, requireOrganization } from '../../common/guards/auth.guard.js'

const router = Router()

router.use(authGuard)
router.use(requireOrganization)

router.get('/', (req, res, next) => auditController.list(req, res, next))

export default router
