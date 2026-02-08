import { Response, NextFunction } from 'express'
import { Request } from 'express'
import { publicService } from './public.service.js'
import { successResponse } from '../../common/utils/api-response.js'

class PublicController {
    async getCompany(req: Request, res: Response, next: NextFunction) {
        try {
            const { slug } = req.params
            const data = await publicService.getCompanyBySlug(slug)
            successResponse(res, 'Company data retrieved', data)
        } catch (error) {
            next(error)
        }
    }

    async getCompanyJobs(req: Request, res: Response, next: NextFunction) {
        try {
            const { slug } = req.params
            const data = await publicService.getCompanyJobs(slug)
            successResponse(res, 'Company jobs retrieved', data)
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
