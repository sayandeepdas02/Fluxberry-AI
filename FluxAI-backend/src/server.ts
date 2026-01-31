import 'dotenv/config'
import { createApp } from './app.js'

const PORT = process.env.PORT || 5001

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

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully')
    process.exit(0)
})

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully')
    process.exit(0)
})
