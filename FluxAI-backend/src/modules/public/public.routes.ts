import { Router } from 'express'
import { publicController } from './public.controller.js'

const router = Router()

// Public routes - NO auth guard

// Company routes (existing)
router.get('/companies/:slug', (req, res, next) =>
    publicController.getCompany(req, res, next)
)

router.get('/companies/:slug/jobs', (req, res, next) =>
    publicController.getCompanyJobs(req, res, next)
)

router.get('/companies/:slug/jobs/:jobId', (req, res, next) =>
    publicController.getJob(req, res, next)
)

// Public job routes (new — by job publicSlug)
router.get('/jobs/:slug', (req, res, next) =>
    publicController.getJobBySlug(req, res, next)
)

router.post('/jobs/:slug/apply', (req, res, next) =>
    publicController.applyToJob(req, res, next)
)

router.post('/jobs/:slug/upload-resume', (req, res, next) =>
    publicController.requestResumeUpload(req, res, next)
)

// Assessment & code execution routes (existing)
router.get('/assessments/:id', (req, res, next) =>
    publicController.getAssessment(req, res, next)
)

router.post('/run-code', (req, res, next) =>
    publicController.runCode(req, res, next)
)

// Public Offer Routes
router.get('/offers/:token', (req, res, next) =>
    publicController.getOfferByToken(req, res, next)
)

router.post('/offers/:token/accept', (req, res, next) =>
    publicController.acceptOffer(req, res, next)
)

router.post('/offers/:token/decline', (req, res, next) =>
    publicController.declineOffer(req, res, next)
)

export default router
