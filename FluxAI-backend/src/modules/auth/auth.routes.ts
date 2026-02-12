import { Router } from 'express'
import { authController } from './auth.controller.js'
import { authGuard } from '../../common/guards/auth.guard.js'

const router = Router()

// Public routes
router.post('/signup', (req, res, next) => authController.signup(req, res, next))
router.post('/login', (req, res, next) => authController.login(req, res, next))

// Protected routes
// Protected routes
router.get('/me', authGuard, (req, res, next) => authController.me(req, res, next))
router.delete('/me', authGuard, (req, res, next) => authController.deleteAccount(req, res, next))

export default router
