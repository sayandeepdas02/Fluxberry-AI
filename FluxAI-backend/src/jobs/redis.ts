import Redis from 'ioredis'

// Redis connection for BullMQ
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

// Create Redis connection with retry strategy
export const redisConnection = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null, // Required for BullMQ
    enableReadyCheck: false,
    retryStrategy: (times) => {
        if (times > 10) {
            console.error('Redis connection failed after 10 retries')
            return null
        }
        return Math.min(times * 200, 5000)
    },
})

redisConnection.on('connect', () => {
    console.log('📦 Redis connected')
})

redisConnection.on('error', (err) => {
    console.error('Redis connection error:', err.message)
})

export default redisConnection
