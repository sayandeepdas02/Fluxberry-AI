/**
 * Structured Logger — JSON-formatted logging with levels and request-ID support
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
}

const MIN_LOG_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info'

interface LogContext {
    requestId?: string
    userId?: string
    organizationId?: string
    [key: string]: unknown
}

function shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LOG_LEVEL]
}

function formatLog(level: LogLevel, message: string, context?: LogContext, error?: Error): string {
    const entry: Record<string, unknown> = {
        timestamp: new Date().toISOString(),
        level: level.toUpperCase(),
        message,
    }

    if (context) {
        // Spread context into log entry, excluding undefined values
        for (const [key, value] of Object.entries(context)) {
            if (value !== undefined) {
                entry[key] = value
            }
        }
    }

    if (error) {
        entry.error = {
            name: error.name,
            message: error.message,
            stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
        }
    }

    return JSON.stringify(entry)
}

class StructuredLogger {
    private context: LogContext = {}

    /**
     * Create a child logger with additional context
     */
    child(context: LogContext): StructuredLogger {
        const child = new StructuredLogger()
        child.context = { ...this.context, ...context }
        return child
    }

    debug(message: string, context?: LogContext): void {
        if (!shouldLog('debug')) return
        console.log(formatLog('debug', message, { ...this.context, ...context }))
    }

    info(message: string, context?: LogContext): void {
        if (!shouldLog('info')) return
        console.log(formatLog('info', message, { ...this.context, ...context }))
    }

    warn(message: string, context?: LogContext): void {
        if (!shouldLog('warn')) return
        console.warn(formatLog('warn', message, { ...this.context, ...context }))
    }

    error(message: string, error?: Error | unknown, context?: LogContext): void {
        if (!shouldLog('error')) return
        const err = error instanceof Error ? error : undefined
        console.error(formatLog('error', message, { ...this.context, ...context }, err))
    }
}

// Singleton logger
export const logger = new StructuredLogger()
