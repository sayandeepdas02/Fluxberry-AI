import { Response, NextFunction } from 'express'
import { Request } from 'express'
import { publicService } from './public.service.js'
import { successResponse } from '../../common/utils/api-response.js'

class PublicController {
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
            const data = await publicService.getJobBySlug(slug)
            res.json(successResponse(data))
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
}

export const publicController = new PublicController()
