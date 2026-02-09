/**
 * AI Interview Routes
 */

import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import { aiInterviewController } from './ai-interview.controller.js'

const router = Router()

// Configure multer for media uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(process.cwd(), 'uploads', 'ai-recordings'))
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        const ext = path.extname(file.originalname)
        cb(null, `ai-recording-${uniqueSuffix}${ext}`)
    },
})

const upload = multer({
    storage,
    limits: {
        fileSize: 500 * 1024 * 1024, // 500MB max (video can be large)
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            'audio/webm',
            'audio/mp4',
            'audio/mpeg',
            'video/webm',
            'video/mp4',
        ]
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true)
        } else {
            cb(new Error('Invalid file type. Only audio/video files are allowed.'))
        }
    },
})

// AI Interview routes (nested under /attempts/:attemptId)
router.post('/:attemptId/ai/start', aiInterviewController.startSession.bind(aiInterviewController))
router.post('/:attemptId/ai/end', aiInterviewController.endSession.bind(aiInterviewController))
router.post('/:attemptId/ai/transcript', aiInterviewController.saveTranscript.bind(aiInterviewController))
router.post('/:attemptId/ai/media', upload.single('file'), aiInterviewController.uploadMedia.bind(aiInterviewController))
router.get('/:attemptId/ai/details', aiInterviewController.getSessionDetails.bind(aiInterviewController))

export default router
