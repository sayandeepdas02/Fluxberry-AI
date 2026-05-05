/**
 * Environment variable validation.
 * Call validateEnv() at startup of both server and worker to fail loudly
 * if critical environment variables are missing.
 */

interface EnvConfig {
    requiredInAll: string[]
    requiredInServer: string[]
    requiredInWorker: string[]
}

const ENV_CONFIG: EnvConfig = {
    requiredInAll: [
        'MONGODB_URI',
        'JWT_SECRET',
    ],
    requiredInServer: [
        'PORT',
        'GOOGLE_CLIENT_ID',
    ],
    requiredInWorker: [
        'RESEND_API_KEY',
        'REDIS_URL',
        'FRONTEND_URL',
    ],
}

function checkKeys(keys: string[], context: string): void {
    const missing: string[] = []
    for (const key of keys) {
        if (!process.env[key]) {
            missing.push(key)
        }
    }
    if (missing.length > 0) {
        throw new Error(
            `[${context}] Missing required environment variables: ${missing.join(', ')}\n` +
            `Please check your .env file.`
        )
    }
}

/**
 * Call this in server.ts to validate server-side env vars.
 */
export function validateServerEnv(): void {
    checkKeys(ENV_CONFIG.requiredInAll, 'Server')
    checkKeys(ENV_CONFIG.requiredInServer, 'Server')
    console.log('✅ Server environment variables validated')
}

/**
 * Call this in worker.ts to validate worker-side env vars.
 * Fails hard on startup — no silent skips.
 */
export function validateWorkerEnv(): void {
    checkKeys(ENV_CONFIG.requiredInAll, 'Worker')
    checkKeys(ENV_CONFIG.requiredInWorker, 'Worker')
    console.log('✅ Worker environment variables validated')
}

export const featureFlags = {
    ENABLE_OFFER_ENGINE: process.env.ENABLE_OFFER_ENGINE === 'true',
    ENABLE_FORM_ENGINE: process.env.ENABLE_FORM_ENGINE === 'true',
    ENABLE_REMINDER_ENGINE: process.env.ENABLE_REMINDER_ENGINE === 'true',
    ENABLE_ANALYTICS: process.env.ENABLE_ANALYTICS === 'true',
}
