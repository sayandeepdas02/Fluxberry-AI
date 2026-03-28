import { Router } from 'express'
import { authController } from './auth.controller.js'
import { authGuard } from '../../common/guards/auth.guard.js'

const router = Router()

// Public routes
router.post('/signup', (req, res, next) => authController.signup(req, res, next))
router.post('/login', (req, res, next) => authController.login(req, res, next))
router.post('/google', (req, res, next) => authController.googleAuth(req, res, next))
router.post('/refresh', (req, res, next) => authController.refreshToken(req, res, next))
router.post('/logout', (req, res) => authController.logout(req, res))

// Protected routes
router.get('/me', authGuard, (req, res, next) => authController.me(req, res, next))
router.delete('/me', authGuard, (req, res, next) => authController.deleteAccount(req, res, next))

export default router
