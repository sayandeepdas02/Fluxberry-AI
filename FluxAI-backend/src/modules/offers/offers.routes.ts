import { Router } from 'express'
import { offersController } from './offers.controller.js'
import { offersTemplateController } from './offers-template.controller.js'
import { authGuard, requireOrgAccess } from '../../common/guards/auth.guard.js'

const router = Router()

// All routes here require Org Access
router.use(authGuard)

// =======================
// TEMPLATE ROUTES
// =======================
// Note: We mount these under /api/offers/templates if we use the main offers router
// Or verify if we should use separate router. But keeping together is fine for now.
// IMPORTANT: Place specific routes BEFORE generic parameters like /:id

router.post('/templates', offersTemplateController.create.bind(offersTemplateController))
router.get('/templates', offersTemplateController.list.bind(offersTemplateController))
router.get('/templates/:id', offersTemplateController.get.bind(offersTemplateController))
router.patch('/templates/:id', offersTemplateController.update.bind(offersTemplateController))

// =======================
// OFFER ROUTES
// =======================
router.post('/', offersController.create.bind(offersController))
router.get('/', offersController.list.bind(offersController))
router.get('/application/:applicationId', offersController.listByApplication.bind(offersController))
router.get('/:id', offersController.getById.bind(offersController))
router.post('/:id/send', offersController.send.bind(offersController))

export const offersRoutes = router
export default router
