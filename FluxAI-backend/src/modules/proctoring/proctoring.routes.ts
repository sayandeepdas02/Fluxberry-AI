import { Router } from 'express'
import { proctoringController } from './proctoring.controller.js'

const router = Router()

// Proctoring routes are nested under attempts
// These will be merged into attempts routes

export default router
