import { Router } from 'express'
import { jobsController } from './jobs.controller.js'
import { applicationsController } from '../applications/applications.controller.js'
import { authGuard, requireOrgAccess } from '../../common/guards/auth.guard.js'

const router = Router()

// All routes require authentication
router.use(authGuard)

// CRUD routes (any authenticated org member)
router.post('/', (req, res, next) => jobsController.create(req, res, next))
router.get('/', (req, res, next) => jobsController.list(req, res, next))
router.get('/:id', (req, res, next) => jobsController.getById(req, res, next))
router.patch('/:id', (req, res, next) => jobsController.update(req, res, next))

// Applications per job
router.get('/:jobId/applications', (req, res, next) => {
    req.params.jobId = req.params.jobId
    applicationsController.listByJob(req, res, next)
})

// Lifecycle routes (ADMIN or OWNER only)
router.post('/:id/publish', requireOrgAccess('ADMIN'), (req, res, next) => jobsController.publish(req, res, next))
router.post('/:id/close', requireOrgAccess('ADMIN'), (req, res, next) => jobsController.close(req, res, next))
router.delete('/:id', requireOrgAccess('ADMIN'), (req, res, next) => jobsController.delete(req, res, next))

export default router
