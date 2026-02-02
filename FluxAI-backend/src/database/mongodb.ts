import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fluxai'

/**
 * Connect to MongoDB
 * Call this before starting the Express server
 */
export async function connectMongoDB(): Promise<void> {
    try {
        await mongoose.connect(MONGODB_URI)
        console.log('✅ MongoDB connected successfully')
    } catch (error) {
        console.error('❌ MongoDB connection error:', error)
        process.exit(1)
    }
}

/**
 * Disconnect from MongoDB
 * Call this on graceful shutdown
 */
export async function disconnectMongoDB(): Promise<void> {
    try {
        await mongoose.disconnect()
        console.log('MongoDB disconnected')
    } catch (error) {
        console.error('MongoDB disconnect error:', error)
    }
}

export default mongoose
