import { Router } from 'express'
import { organizationsController } from './organizations.controller.js'
import { authGuard } from '../../common/guards/auth.guard.js'

const router = Router()

// All routes require authentication
router.use(authGuard)

// List all organizations user belongs to
router.get('/', (req, res, next) => organizationsController.getAll(req, res, next))

// Get members of the current organization
router.get('/members', (req, res, next) => organizationsController.getMembers(req, res, next))

// Get specific organization by ID
router.get('/:orgId', (req, res, next) => organizationsController.getById(req, res, next))

export default router
