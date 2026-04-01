import { Response, NextFunction } from 'express'
import { Request } from 'express'
import { publicService } from './public.service.js'
import { offersService } from '../offers/offers.service.js'
import { successResponse } from '../../common/utils/api-response.js'
import redis from '../../jobs/redis.js'
import crypto from 'crypto'

class PublicController {
    /**
     * GET /api/public/jobs
     * Global public job board listing — search, filter, paginate.
     * Cached in Redis for 60 seconds keyed by query params.
     */
    async listJobs(req: Request, res: Response, next: NextFunction) {
        try {
            const { search, location, employmentType, remote, expMin, page, limit } = req.query
            const query = {
                search:         typeof search         === 'string' ? search         : undefined,
                location:       typeof location       === 'string' ? location       : undefined,
                employmentType: typeof employmentType === 'string' ? employmentType : undefined,
                remote:         remote === 'true' ? true : undefined,
                expMin:         expMin ? parseInt(expMin as string, 10) : undefined,
                page:           page   ? parseInt(page  as string, 10) : 1,
                limit:          limit  ? parseInt(limit as string, 10) : 20,
            }

            // Cache key is a hash of the query so all permutations are cached
            const cacheKey = `public:jobs:${crypto.createHash('md5').update(JSON.stringify(query)).digest('hex')}`
            const cached = await redis.get(cacheKey)
            if (cached) {
                return res.json(JSON.parse(cached))
            }

            const data = await publicService.listPublicJobs(query)
            const response = successResponse(data)
            await redis.set(cacheKey, JSON.stringify(response), 'EX', 60) // 60s cache
            res.json(response)
        } catch (error) {
            next(error)
        }
    }

    async getCompany(req: Request, res: Response, next: NextFunction) {
        try {
            const { slug } = req.params
            const data = await publicService.getCompanyBySlug(slug)
            res.json(successResponse(data))
        } catch (error) {
            next(error)
        }
    }

    async getCompanyJobs(req: Request, res: Response, next: NextFunction) {
        try {
            const { slug } = req.params
            const data = await publicService.getCompanyJobs(slug)
            res.json(successResponse(data))
        } catch (error) {
            next(error)
        }
    }

    async getJob(req: Request, res: Response, next: NextFunction) {
        try {
            const { slug, jobId } = req.params
            const data = await publicService.getJob(slug, jobId)
            res.json(successResponse(data))
        } catch (error) {
            next(error)
        }
    }

    /**
     * GET /api/public/jobs/:slug
     * Get a published job by its public slug
     */
    async getJobBySlug(req: Request, res: Response, next: NextFunction) {
        try {
            const { slug } = req.params
            const cacheKey = `public:job:${slug}`
            const cached = await redis.get(cacheKey)

            if (cached) {
                return res.json(JSON.parse(cached))
            }

            const data = await publicService.getJobBySlug(slug)
            const response = successResponse(data)

            await redis.set(cacheKey, JSON.stringify(response), 'EX', 300) // 5 minutes

            res.json(response)
        } catch (error) {
            next(error)
        }
    }

    /**
     * POST /api/public/jobs/:slug/apply
     * Submit application for a published job
     */
    async applyToJob(req: Request, res: Response, next: NextFunction) {
        try {
            const { slug } = req.params
            const data = await publicService.submitApplication(slug, req.body)
            res.status(201).json(successResponse(data))
        } catch (error) {
            next(error)
        }
    }

    /**
     * POST /api/public/jobs/:slug/upload-resume
     * Get a pre-signed URL for resume upload
     */
    async requestResumeUpload(req: Request, res: Response, next: NextFunction) {
        try {
            const { slug } = req.params
            const data = await publicService.requestResumeUploadUrl(slug, req.body)
            res.status(201).json(successResponse(data))
        } catch (error) {
            next(error)
        }
    }

    async getAssessment(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params
            const data = await publicService.getAssessment(id)
            res.json(successResponse(data))
        } catch (error) {
            next(error)
        }
    }

    /**
     * POST /api/public/run-code — run code via Judge0 (for DSA "Run Code" in UI)
     * Body: { code: string, language: string, stdin?: string }
     */
    async runCode(req: Request, res: Response, next: NextFunction) {
        try {
            const { code, language, stdin } = req.body ?? {}
            const data = await publicService.runCode({ code: code ?? '', language: language ?? 'python', stdin })
            res.json(successResponse(data))
        } catch (error) {
            next(error)
        }
    }

    // ============================================
    // OFFER ROUTES
    // ============================================

    async getOfferByToken(req: Request, res: Response, next: NextFunction) {
        try {
            const { token } = req.params
            const data = await offersService.getOfferByToken(token)
            res.json(successResponse(data))
        } catch (error) {
            next(error)
        }
    }

    async acceptOffer(req: Request, res: Response, next: NextFunction) {
        try {
            const { token } = req.params
            const { signature } = req.body // { name, data, type }
            const ipAddress = req.ip || req.connection.remoteAddress || '0.0.0.0'
            const data = await offersService.recordSignature(token, signature, ipAddress)
            res.json(successResponse(data))
        } catch (error) {
            next(error)
        }
    }

    async declineOffer(req: Request, res: Response, next: NextFunction) {
        try {
            const { token } = req.params
            const { reason } = req.body
            const ipAddress = req.ip || req.connection.remoteAddress || '0.0.0.0'
            const data = await offersService.rejectOffer(token, reason, ipAddress)
            res.json(successResponse(data))
        } catch (error) {
            next(error)
        }
    }

    // ============================================
    // ONBOARDING FORM ROUTES
    // ============================================

    async getOnboardingForm(req: Request, res: Response, next: NextFunction) {
        try {
            const { onboardingId } = req.params
            const { onboardingFormService } = await import('../onboarding/onboarding-form.service.js')
            const data = await onboardingFormService.fetchFormResponse(onboardingId)
            res.json(successResponse(data))
        } catch (error) {
            next(error)
        }
    }

    async saveOnboardingFormDraft(req: Request, res: Response, next: NextFunction) {
        try {
            const { onboardingId } = req.params
            const { responses } = req.body
            const { onboardingFormService } = await import('../onboarding/onboarding-form.service.js')
            const data = await onboardingFormService.saveFormDraft(onboardingId, responses)
            res.json(successResponse(data))
        } catch (error) {
            next(error)
        }
    }

    async submitOnboardingForm(req: Request, res: Response, next: NextFunction) {
        try {
            const { onboardingId } = req.params
            const { responses } = req.body
            const { onboardingFormService } = await import('../onboarding/onboarding-form.service.js')
            const data = await onboardingFormService.submitForm(onboardingId, responses)
            res.json(successResponse(data))
        } catch (error) {
            next(error)
        }
    }
}

export const publicController = new PublicController()
