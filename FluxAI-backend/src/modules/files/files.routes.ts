import { Router } from 'express'
import { filesController } from './files.controller.js'

const router = Router()

// Request pre-signed upload URL
router.post('/upload-url', (req, res, next) => filesController.requestUploadUrl(req, res, next))

export default router
