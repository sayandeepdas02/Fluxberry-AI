import { Router } from 'express'
import { candidatesController } from './candidates.controller.js'
import { authGuard } from '../../common/guards/auth.guard.js'

const router = Router()

router.use(authGuard)

router.post('/', (req, res, next) => candidatesController.create(req, res, next))
router.get('/', (req, res, next) => candidatesController.list(req, res, next))
router.get('/:id', (req, res, next) => candidatesController.getById(req, res, next))
router.patch('/:id', (req, res, next) => candidatesController.update(req, res, next))
router.post('/:id/notes', (req, res, next) => candidatesController.addNote(req, res, next))
router.post('/:id/resume', (req, res, next) => candidatesController.attachResume(req, res, next))

export default router
