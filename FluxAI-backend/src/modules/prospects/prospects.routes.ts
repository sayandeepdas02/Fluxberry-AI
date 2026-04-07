import { Router } from 'express'
import { authGuard } from '../../common/guards/auth.guard.js'
import { prospectsController } from './prospects.controller.js'

const router = Router()

// All routes require auth
router.use(authGuard)

// ── Prospects ────────────────────────────────────────────
router.get('/', (req, res, next) => prospectsController.list(req, res, next))
router.post('/', (req, res, next) => prospectsController.create(req, res, next))
router.post('/bulk', (req, res, next) => prospectsController.createBulk(req, res, next))
router.get('/:id', (req, res, next) => prospectsController.getById(req, res, next))
router.get('/:id/fit', (req, res, next) => prospectsController.getProspectFit(req, res, next))
router.patch('/:id', (req, res, next) => prospectsController.update(req, res, next))
router.post('/:id/convert', (req, res, next) => prospectsController.convertToCandidate(req, res, next))

// ── Lists ────────────────────────────────────────────────
router.get('/lists/all', (req, res, next) => prospectsController.listLists(req, res, next))
router.post('/lists', (req, res, next) => prospectsController.createList(req, res, next))
router.get('/lists/:id', (req, res, next) => prospectsController.getListById(req, res, next))
router.post('/lists/:id/add', (req, res, next) => prospectsController.addToList(req, res, next))
router.post('/lists/:id/remove', (req, res, next) => prospectsController.removeFromList(req, res, next))

// ── Campaigns ────────────────────────────────────────────
router.get('/campaigns/all', (req, res, next) => prospectsController.listCampaigns(req, res, next))
router.post('/campaigns', (req, res, next) => prospectsController.createCampaign(req, res, next))
router.get('/campaigns/:id', (req, res, next) => prospectsController.getCampaignById(req, res, next))
router.post('/campaigns/:id/send', (req, res, next) => prospectsController.sendCampaign(req, res, next))
router.get('/campaigns/:id/messages', (req, res, next) => prospectsController.getCampaignMessages(req, res, next))

export default router
