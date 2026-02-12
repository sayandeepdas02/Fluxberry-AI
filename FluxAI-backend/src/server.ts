import 'dotenv/config'
import { createApp } from './app.js'
import { connectMongoDB, disconnectMongoDB } from './database/mongodb.js'
import { startCronJobs } from './jobs/cron.js'
import { initScheduler } from './jobs/scheduler.js'

const PORT = process.env.PORT || 5001

async function main() {
    // Connect to MongoDB
    await connectMongoDB()

    // Start cron jobs
    startCronJobs()

    // Initialize Jobs
    await initScheduler()

    const app = createApp()

    const server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`)
        console.log(`Environment: ${process.env.NODE_ENV}`)
    })

    // Graceful shutdown
    const shutdown = async () => {
        console.log('Shutting down server...')
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
