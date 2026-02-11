import { Router } from 'express'
import { applicationsController } from './applications.controller.js'
import { authGuard } from '../../common/guards/auth.guard.js'

const router = Router()

router.use(authGuard)

// GET /api/applications/:id
router.get('/:id', (req, res, next) => applicationsController.getById(req, res, next))

// PATCH /api/applications/:id/stage
router.patch('/:id/stage', (req, res, next) => applicationsController.updateStage(req, res, next))

// POST /api/applications/bulk-update
router.post('/bulk-update', (req, res, next) => applicationsController.bulkUpdate(req, res, next))

export default router
