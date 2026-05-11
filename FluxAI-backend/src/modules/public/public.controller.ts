import { Response, NextFunction } from 'express'
import { Request } from 'express'
import { publicService } from './public.service.js'
import { offersService } from '../offers/offers.service.js'
import redis from '../../jobs/redis.js'
import crypto from 'crypto'

class PublicController {
    /**
     * GET /api/public/jobs
     * Global public job board listing — search, filter, paginate.
     * Data (not the full envelope) is cached in Redis for 60 seconds.
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

            const cacheKey = `public:jobs:${crypto.createHash('md5').update(JSON.stringify(query)).digest('hex')}`
            const cached = await redis.get(cacheKey)
            if (cached) {
                return res.success(JSON.parse(cached))
            }

            const data = await publicService.listPublicJobs(query)
            await redis.set(cacheKey, JSON.stringify(data), 'EX', 60)
            res.success(data)
        } catch (error) {
            next(error)
        }
    }

    async getCompany(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await publicService.getCompanyBySlug(req.params.slug)
            res.success(data)
        } catch (error) {
            next(error)
        }
    }

    async getCompanyJobs(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await publicService.getCompanyJobs(req.params.slug)
            res.success(data)
        } catch (error) {
            next(error)
        }
    }

    async getJob(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await publicService.getJob(req.params.slug, req.params.jobId)
            res.success(data)
        } catch (error) {
            next(error)
        }
    }

    async getJobBySlug(req: Request, res: Response, next: NextFunction) {
        try {
            const cacheKey = `public:job:${req.params.slug}`
            const cached = await redis.get(cacheKey)
            if (cached) {
                return res.success(JSON.parse(cached))
            }
            const data = await publicService.getJobBySlug(req.params.slug)
            await redis.set(cacheKey, JSON.stringify(data), 'EX', 300)
            res.success(data)
        } catch (error) {
            next(error)
        }
    }

    async applyToJob(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await publicService.submitApplication(req.params.slug, req.body)
            res.success(data, 201)
        } catch (error) {
            next(error)
        }
    }

    async requestResumeUpload(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await publicService.requestResumeUploadUrl(req.params.slug, req.body)
            res.success(data, 201)
        } catch (error) {
            next(error)
        }
    }

    async getAssessment(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await publicService.getAssessment(req.params.id)
            res.success(data)
        } catch (error) {
            next(error)
        }
    }

    async runCode(req: Request, res: Response, next: NextFunction) {
        try {
            const { code, language, stdin } = req.body ?? {}
            const data = await publicService.runCode({ code: code ?? '', language: language ?? 'python', stdin })
            res.success(data)
        } catch (error) {
            next(error)
        }
    }

    async getOfferByToken(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await offersService.getOfferByToken(req.params.token)
            res.success(data)
        } catch (error) {
            next(error)
        }
    }

    async acceptOffer(req: Request, res: Response, next: NextFunction) {
        try {
            const ipAddress = req.ip || req.connection.remoteAddress || '0.0.0.0'
            const data = await offersService.recordSignature(req.params.token, req.body.signature, ipAddress)
            res.success(data)
        } catch (error) {
            next(error)
        }
    }

    async declineOffer(req: Request, res: Response, next: NextFunction) {
        try {
            const ipAddress = req.ip || req.connection.remoteAddress || '0.0.0.0'
            const data = await offersService.rejectOffer(req.params.token, req.body.reason, ipAddress)
            res.success(data)
        } catch (error) {
            next(error)
        }
    }

    async getOnboardingForm(req: Request, res: Response, next: NextFunction) {
        try {
            const { onboardingFormService } = await import('../onboarding/onboarding-form.service.js')
            const data = await onboardingFormService.fetchFormResponse(req.params.onboardingId)
            res.success(data)
        } catch (error) {
            next(error)
        }
    }

    async saveOnboardingFormDraft(req: Request, res: Response, next: NextFunction) {
        try {
            const { onboardingFormService } = await import('../onboarding/onboarding-form.service.js')
            const data = await onboardingFormService.saveFormDraft(req.params.onboardingId, req.body.responses)
            res.success(data)
        } catch (error) {
            next(error)
        }
    }

    async submitOnboardingForm(req: Request, res: Response, next: NextFunction) {
        try {
            const { onboardingFormService } = await import('../onboarding/onboarding-form.service.js')
            const data = await onboardingFormService.submitForm(req.params.onboardingId, req.body.responses)
            res.success(data)
        } catch (error) {
            next(error)
        }
    }
}

export const publicController = new PublicController()
