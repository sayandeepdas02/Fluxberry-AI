import 'dotenv/config'
import { Server as SocketIOServer } from 'socket.io'
import { createApp } from './app.js'
import { connectMongoDB, disconnectMongoDB } from './database/mongodb.js'
import { startCronJobs } from './jobs/cron.js'
import { initScheduler } from './jobs/scheduler.js'
import { validateServerEnv } from './config/env.js'
import { createGateway } from './modules/ai-interview/gateway.js'

const PORT = process.env.PORT || 5001

async function main() {
    // Validate environment variables — fail loudly if anything is missing
    validateServerEnv()

    // Connect to MongoDB
    await connectMongoDB()

    // Start cron jobs
    startCronJobs()

    // Initialize Jobs
    await initScheduler()

    // Start the Queue Processors (including new AI Voice Queue)
    const { VoiceQueueManager } = await import('./services/ai-voice/voicePlaybackQueue.js')
    VoiceQueueManager.initializeWorker();

    // Start advanced offer/onboarding reminder Cron
    const mod = await import('./jobs/reminder.engine.js')
    if (mod.reminderEngine) {
        mod.reminderEngine.startJobs()
    }

    const app = createApp()

    const server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`)
        console.log(`Environment: ${process.env.NODE_ENV}`)
    })

    // ── Socket.IO — attached to the same HTTP server ──────────────────────
    const corsOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:3001']
    const io = new SocketIOServer(server, {
        cors: {
            origin: corsOrigins,
            credentials: true,
        },
        // Increase buffer for audio chunks (each chunk ~100KB)
        maxHttpBufferSize: 1e7, // 10MB
    })

    // Initialize the AI Interview real-time gateway
    createGateway(io)

    // Inject the global socket instance for pipeline emission
    const { TranscriptEmitter } = await import('./services/voice/transcriptEmitter.js')
    const { InterviewOrchestrator } = await import('./ai/interview/interviewOrchestrator.js')
    const { VoiceQueueManager: VQM } = await import('./services/ai-voice/voicePlaybackQueue.js')
    const { VoiceStreamService } = await import('./services/ai-voice/voiceStream.service.js')

    TranscriptEmitter.setSocketServer(io);
    InterviewOrchestrator.setSocketServer(io);
    VQM.setSocketServer(io);
    VoiceStreamService.setSocketServer(io);

    // Graceful shutdown
    const shutdown = async () => {
        console.log('Shutting down server...')
        io.close()
        server.close(async () => {
            console.log('HTTP server closed')
            await disconnectMongoDB()
            process.exit(0)
        })
    }

    process.on('SIGTERM', shutdown)
    process.on('SIGINT', shutdown)
}

main().catch((error) => {
    console.error('Failed to start server:', error)
    process.exit(1)
})
