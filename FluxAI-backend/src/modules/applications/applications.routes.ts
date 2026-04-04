import { Router } from 'express'
import { applicationsController } from './applications.controller.js'
import { authGuard } from '../../common/guards/auth.guard.js'

const router = Router()

router.use(authGuard)

// POST /api/applications
router.post('/', (req, res, next) => applicationsController.create(req, res, next))

// GET /api/applications/:id
router.get('/:id', (req, res, next) => applicationsController.getById(req, res, next))

// PATCH /api/applications/:id/stage (legacy — uses status string)
router.patch('/:id/stage', (req, res, next) => applicationsController.updateStage(req, res, next))

// PATCH /api/applications/:id/move-stage (new — uses stage ID)
router.patch('/:id/move-stage', (req, res, next) => applicationsController.moveStage(req, res, next))

// POST /api/applications/bulk-update (legacy)
router.post('/bulk-update', (req, res, next) => applicationsController.bulkUpdate(req, res, next))

// POST /api/applications/bulk-move (new — uses stage IDs)
router.post('/bulk-move', (req, res, next) => applicationsController.bulkMove(req, res, next))

// GET /api/applications/:id/stage-history
router.get('/:id/stage-history', (req, res, next) => applicationsController.getStageHistory(req, res, next))

export default router

