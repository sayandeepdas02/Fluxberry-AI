import { Router } from 'express'
import { assessmentsController } from './assessments.controller.js'
import { authGuard } from '../../common/guards/auth.guard.js'

const router = Router()

// All routes require authentication
router.use(authGuard)

// Assessment CRUD
router.post('/', (req, res, next) => assessmentsController.create(req, res, next))
router.get('/', (req, res, next) => assessmentsController.list(req, res, next))
router.get('/:id', (req, res, next) => assessmentsController.getById(req, res, next))
router.patch('/:id', (req, res, next) => assessmentsController.update(req, res, next))

// Round configuration
router.put('/:id/rounds', (req, res, next) => assessmentsController.configureRounds(req, res, next))

// Publishing
router.post('/:id/publish', (req, res, next) => assessmentsController.publish(req, res, next))

export default router
