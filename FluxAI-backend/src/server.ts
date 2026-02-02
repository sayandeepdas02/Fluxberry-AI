import 'dotenv/config'
import { createApp } from './app.js'
import { connectMongoDB, disconnectMongoDB } from './database/mongodb.js'

const PORT = process.env.PORT || 5001

async function main() {
    // Connect to MongoDB before starting server
    await connectMongoDB()

    const app = createApp()

    app.listen(PORT, () => {
        console.log(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║   🚀 FluxAI Backend Server                        ║
║                                                   ║
║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(15)}              ║
║   Port:        ${String(PORT).padEnd(15)}              ║
║                                                   ║
║   Health:      http://localhost:${PORT}/api/health    ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
  `)
    })
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully')
    await disconnectMongoDB()
    process.exit(0)
})

process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully')
    await disconnectMongoDB()
    process.exit(0)
})

main().catch((error) => {
    console.error('Failed to start server:', error)
    process.exit(1)
})
