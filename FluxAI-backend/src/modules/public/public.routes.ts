import { Router } from 'express'
import { publicController } from './public.controller.js'

const router = Router()

// Public routes - NO auth guard
router.get('/companies/:slug', (req, res, next) =>
    publicController.getCompany(req, res, next)
)

router.get('/companies/:slug/jobs', (req, res, next) =>
    publicController.getCompanyJobs(req, res, next)
)

router.get('/companies/:slug/jobs/:jobId', (req, res, next) =>
    publicController.getJob(req, res, next)
)

export default router
