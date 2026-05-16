import { ApiResponse } from './types'
import { getAccessToken } from '@/lib/context/auth-context'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'
const REQUEST_TIMEOUT_MS = 30_000

// Pluggable sign-out callback — wired by AuthProvider on mount
let onUnauthorized: (() => void) | null = null
// Token updater — wired by AuthProvider so the module-level token stays current after refresh
let onTokenRefreshed: ((token: string) => void) | null = null

export function setUnauthorizedHandler(handler: () => void): void {
    onUnauthorized = handler
}

export function setTokenRefreshedHandler(handler: (token: string) => void): void {
    onTokenRefreshed = handler
}

export class ApiError extends Error {
    public readonly code: string
    public readonly details?: unknown

    constructor(message: string, code: string, details?: unknown) {
        super(message)
        this.name = 'ApiError'
        this.code = code
        this.details = details
    }

    get isClientError(): boolean {
        const clientCodes = [
            'NOT_FOUND', 'UNAUTHORIZED', 'FORBIDDEN', 'CONFLICT',
            'VALIDATION_ERROR', 'BAD_REQUEST', 'INVALID_INPUT',
        ]
        return clientCodes.includes(this.code) || this.code.startsWith('INVALID')
    }
}

function generateRequestId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`
}

async function parseResponseBody(response: Response): Promise<unknown> {
    const contentType = response.headers.get('Content-Type') ?? ''
    if (contentType.includes('application/json')) {
        return response.json()
    }
    const text = await response.text().catch(() => '')
    return {
        success: false,
        error: {
            code: 'INVALID_RESPONSE',
            message: text.substring(0, 200) || `HTTP ${response.status}`,
        },
    }
}

class ApiClient {
    private baseUrl: string
    private isRefreshing = false
    private failedQueue: Array<{
        resolve: (token: string) => void
        reject: (error: unknown) => void
    }> = []

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl
    }

    private processQueue(error: unknown, token: string | null = null): void {
        this.failedQueue.forEach(prom => {
            if (error) prom.reject(error)
            else prom.resolve(token as string)
        })
        this.failedQueue = []
    }

    private async fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
        try {
            return await fetch(url, { ...init, signal: controller.signal })
        } catch (e) {
            if ((e as Error).name === 'AbortError') {
                throw Object.assign(new Error('Request timed out'), { code: 'TIMEOUT' })
            }
            throw e
        } finally {
            clearTimeout(timer)
        }
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {},
        tokenOverride?: string
    ): Promise<ApiResponse<T>> {
        const token = tokenOverride !== undefined ? tokenOverride : getAccessToken()

        const headers: Record<string, string> = {
            'X-Request-ID': generateRequestId(),
            ...(options.headers as Record<string, string>),
        }

        if (!(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json'
        }

        if (token) {
            headers['Authorization'] = `Bearer ${token}`
        }

        try {
            let response = await this.fetchWithTimeout(`${this.baseUrl}${endpoint}`, {
                ...options,
                headers,
                credentials: 'include',
            })

            let data: any = await parseResponseBody(response)

            if (!response.ok) {
                const errCode = data?.error?.code

                if (response.status === 401 && errCode === 'TOKEN_EXPIRED') {
                    if (this.isRefreshing) {
                        return new Promise<ApiResponse<T>>((resolve) => {
                            this.failedQueue.push({
                                resolve: (newToken) => resolve(this.request<T>(endpoint, options, newToken)),
                                reject: () => resolve({
                                    success: false,
                                    error: { code: 'UNAUTHORIZED', message: 'Session expired' },
                                }),
                            })
                        })
                    }

                    this.isRefreshing = true

                    try {
                        const refreshRes = await this.fetchWithTimeout(`${this.baseUrl}/auth/refresh`, {
                            method: 'POST',
                            credentials: 'include',
                        })
                        const refreshData = await parseResponseBody(refreshRes) as any

                        if (refreshRes.ok && refreshData?.success && refreshData?.data?.tokens?.accessToken) {
                            const newToken = refreshData.data.tokens.accessToken
                            // Update the module-level token in auth-context
                            onTokenRefreshed?.(newToken)
                            this.processQueue(null, newToken)

                            response = await this.fetchWithTimeout(`${this.baseUrl}${endpoint}`, {
                                ...options,
                                headers: { ...headers, Authorization: `Bearer ${newToken}` },
                                credentials: 'include',
                            })
                            data = await parseResponseBody(response)
                        } else {
                            throw new Error('Refresh failed')
                        }
                    } catch (refreshErr) {
                        this.processQueue(refreshErr, null)
                        onUnauthorized?.()
                        return { success: false, error: { code: 'UNAUTHORIZED', message: 'Session expired' } }
                    } finally {
                        this.isRefreshing = false
                    }
                } else if (response.status === 401) {
                    if (errCode !== 'TOO_MANY_REQUESTS') {
                        onUnauthorized?.()
                    }
                }

                if (!response.ok) {
                    return {
                        success: false,
                        error: (data as any)?.error ?? { code: 'UNKNOWN', message: 'Request failed' },
                    }
                }
            }

            return data as ApiResponse<T>
        } catch (error) {
            const isTimeout = (error as any)?.code === 'TIMEOUT'
            return {
                success: false,
                error: {
                    code: isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR',
                    message: isTimeout
                        ? 'Request timed out. Please try again.'
                        : 'Network request failed',
                },
            }
        }
    }

    async get<T>(endpoint: string, params?: Record<string, any>, options?: RequestInit): Promise<ApiResponse<T>> {
        let url = endpoint
        if (params) {
            const searchParams = new URLSearchParams()
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    searchParams.append(key, String(value))
                }
            })
            const queryString = searchParams.toString()
            if (queryString) url += `?${queryString}`
        }
        return this.request<T>(url, { ...options, method: 'GET' })
    }

    async post<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<ApiResponse<T>> {
        const isFormData = body instanceof FormData
        return this.request<T>(endpoint, {
            ...options,
            method: 'POST',
            body: isFormData ? (body as BodyInit) : (body !== undefined ? JSON.stringify(body) : undefined),
        })
    }

    async patch<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<ApiResponse<T>> {
        const isFormData = body instanceof FormData
        return this.request<T>(endpoint, {
            ...options,
            method: 'PATCH',
            body: isFormData ? (body as BodyInit) : (body !== undefined ? JSON.stringify(body) : undefined),
        })
    }

    async put<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<ApiResponse<T>> {
        const isFormData = body instanceof FormData
        return this.request<T>(endpoint, {
            ...options,
            method: 'PUT',
            body: isFormData ? (body as BodyInit) : (body !== undefined ? JSON.stringify(body) : undefined),
        })
    }

    async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, { method: 'DELETE' })
    }
}

export const apiClient = new ApiClient(API_BASE_URL)
