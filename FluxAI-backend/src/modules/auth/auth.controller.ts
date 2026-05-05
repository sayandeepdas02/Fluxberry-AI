import { Request, Response, NextFunction } from 'express'
import { authService } from './auth.service.js'
import { signupSchema, loginSchema, googleAuthSchema } from './auth.types.js'
import { successResponse } from '../../common/utils/api-response.js'
import { AuthenticatedRequest } from '../../common/guards/auth.guard.js'

export class AuthController {
    private setRefreshCookie(res: Response, refreshToken: string) {
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/'
        })
    }

    private clearRefreshCookie(res: Response) {
        res.clearCookie('refreshToken', { path: '/' })
    }

    /**
     * POST /api/auth/signup
     */
    async signup(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const input = signupSchema.parse(req.body)
            const result = await authService.signup(input)
            this.setRefreshCookie(res, result.tokens.refreshToken)
            res.status(201).json(successResponse({ user: result.user, tokens: { accessToken: result.tokens.accessToken, expiresIn: result.tokens.expiresIn } }))
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
            this.setRefreshCookie(res, result.tokens.refreshToken)
            res.json(successResponse({ user: result.user, tokens: { accessToken: result.tokens.accessToken, expiresIn: result.tokens.expiresIn } }))
        } catch (error) {
            next(error)
        }
    }

    /**
     * POST /api/auth/google
     */
    async googleAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const input = googleAuthSchema.parse(req.body)
            const result = await authService.googleAuth(input)
            this.setRefreshCookie(res, result.tokens.refreshToken)
            res.json(successResponse({ user: result.user, tokens: { accessToken: result.tokens.accessToken, expiresIn: result.tokens.expiresIn } }))
        } catch (error) {
            next(error)
        }
    }

    /**
     * POST /api/auth/refresh
     */
    async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const token = req.cookies?.refreshToken
            if (!token) {
                res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No refresh token provided' } })
                return
            }
            const tokens = await authService.refreshToken(token)
            this.setRefreshCookie(res, tokens.refreshToken)
            res.json(successResponse({ tokens: { accessToken: tokens.accessToken, expiresIn: tokens.expiresIn } }))
        } catch (error) {
            this.clearRefreshCookie(res)
            next(error)
        }
    }

    /**
     * POST /api/auth/logout
     */
    async logout(_req: Request, res: Response): Promise<void> {
        this.clearRefreshCookie(res)
        res.json(successResponse({ message: 'Logged out successfully' }))
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
            this.clearRefreshCookie(res)
            res.json(successResponse({ message: 'Account deleted successfully' }))
        } catch (error) {
            next(error)
        }
    }
}

export const authController = new AuthController()
