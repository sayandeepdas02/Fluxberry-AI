import { Request, Response, NextFunction } from 'express'
import { authService } from './auth.service.js'
import { signupSchema, loginSchema } from './auth.types.js'
import { successResponse } from '../../common/utils/api-response.js'
import { AuthenticatedRequest } from '../../common/guards/auth.guard.js'

export class AuthController {
    /**
     * POST /api/auth/signup
     */
    async signup(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const input = signupSchema.parse(req.body)
            const result = await authService.signup(input)
            res.status(201).json(successResponse(result))
        } catch (error) {
            next(error)
        }
    }

    /**
     * POST /api/auth/login
     */
    async login(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const input = loginSchema.parse(req.body)
            const result = await authService.login(input)
            res.json(successResponse(result))
        } catch (error) {
            next(error)
        }
    }

    /**
     * GET /api/auth/me
     */
    async me(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user?.id) {
                res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } })
                return
            }
            const user = await authService.getCurrentUser(req.user.id)
            res.json(successResponse(user))
        } catch (error) {
            next(error)
        }
    }

    /**
     * DELETE /api/auth/me
     */
    async deleteAccount(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user?.id) {
                res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } })
                return
            }
            await authService.deleteAccount(req.user.id)
            res.json(successResponse({ message: 'Account deleted successfully' }))
        } catch (error) {
            next(error)
        }
    }
}

export const authController = new AuthController()
