import { Router } from 'express'
import { jobsController } from './jobs.controller.js'
import { authGuard } from '../../common/guards/auth.guard.js'

const router = Router()

// All routes require authentication
router.use(authGuard)

router.post('/', (req, res, next) => jobsController.create(req, res, next))
router.get('/', (req, res, next) => jobsController.list(req, res, next))
router.get('/:id', (req, res, next) => jobsController.getById(req, res, next))
router.patch('/:id', (req, res, next) => jobsController.update(req, res, next))

export default router
