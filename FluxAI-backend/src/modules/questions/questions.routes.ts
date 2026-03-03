import { Router } from 'express'
import { questionsController } from './questions.controller.js'
import { authGuard } from '../../common/guards/auth.guard.js'

const router = Router()

// All routes require authentication
router.use(authGuard)

router.get('/', (req, res, next) => questionsController.list(req, res, next))
router.get('/:id', (req, res, next) => questionsController.getById(req, res, next))
router.post('/', (req, res, next) => questionsController.create(req, res, next))
router.patch('/:id', (req, res, next) => questionsController.update(req, res, next))
router.delete('/:id', (req, res, next) => questionsController.delete(req, res, next))

export default router
