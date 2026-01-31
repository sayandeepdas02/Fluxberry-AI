import { Router } from 'express'
import { questionsController } from './questions.controller.js'
import { authGuard } from '../../common/guards/auth.guard.js'

const router = Router()

// All routes require authentication
router.use(authGuard)

// Read-only question bank endpoints
router.get('/', (req, res, next) => questionsController.list(req, res, next))
router.get('/:id', (req, res, next) => questionsController.getById(req, res, next))

export default router
