import { ApiResponse } from './types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'

// Token storage helpers
const TOKEN_KEY = 'fluxai_token'

export function getStoredToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(TOKEN_KEY)
}

export function setStoredToken(token: string): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(TOKEN_KEY, token)
}

export function clearStoredToken(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(TOKEN_KEY)
}

// API Client
class ApiClient {
    private baseUrl: string
    private isRefreshing = false
    private failedQueue: { resolve: (token: string) => void; reject: (error: any) => void; }[] = []

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl
    }

    private processQueue(error: any, token: string | null = null) {
        this.failedQueue.forEach(prom => {
            if (error) prom.reject(error)
            else prom.resolve(token as string)
        })
        this.failedQueue = []
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {},
        tokenOverride?: string
    ): Promise<ApiResponse<T>> {
        const token = tokenOverride !== undefined ? tokenOverride : getStoredToken()

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...options.headers,
        }

        if (options.body instanceof FormData) {
            if (headers && typeof headers === 'object' && !('delete' in headers)) {
                delete (headers as Record<string, string>)['Content-Type'];
            }
        }

        if (token) {
            (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
        }

        try {
            let response = await fetch(`${this.baseUrl}${endpoint}`, {
                ...options,
                headers,
                credentials: 'include',
            })

            let data: any
            try {
                data = await response.json()
            } catch (e) {
                return { success: false, error: { code: 'NETWORK_ERROR', message: 'Invalid response format' } }
            }

            if (!response.ok) {
                const errCode = data.error?.code

                // Interceptor Logic
                if (response.status === 401 && errCode === 'TOKEN_EXPIRED') {
                    if (this.isRefreshing) {
                        return new Promise((resolve) => {
                            this.failedQueue.push({
                                resolve: (newToken) => resolve(this.request<T>(endpoint, options, newToken)),
                                reject: () => resolve({ success: false, error: { code: 'UNAUTHORIZED', message: 'Session expired' } })
                            })
                        })
                    }

                    this.isRefreshing = true

                    try {
                        const refreshRes = await fetch(`${this.baseUrl}/auth/refresh`, {
                            method: 'POST',
                            credentials: 'include'
                        })
                        const refreshData = await refreshRes.json()

                        if (refreshRes.ok && refreshData.success && refreshData.data?.tokens) {
                            const newToken = refreshData.data.tokens.accessToken
                            setStoredToken(newToken)
                            this.processQueue(null, newToken)
                            
                            // Retry original
                            response = await fetch(`${this.baseUrl}${endpoint}`, {
                                ...options,
                                headers: { ...headers, Authorization: `Bearer ${newToken}` },
                                credentials: 'include',
                            })
                            data = await response.json()
                        } else {
                            throw new Error('Refresh failed')
                        }
                    } catch (refreshErr) {
                        this.processQueue(refreshErr, null)
                        clearStoredToken()
                        if (typeof window !== 'undefined') window.dispatchEvent(new Event('auth:unauthorized'))
                        return { success: false, error: { code: 'UNAUTHORIZED', message: 'Session expired' } }
                    } finally {
                        this.isRefreshing = false
                    }
                } else if (response.status === 401) {
                    if (typeof window !== 'undefined') window.dispatchEvent(new Event('auth:unauthorized'))
                }

                if (!response.ok) { 
                    return {
                        success: false,
                        error: data.error || { code: 'UNKNOWN', message: 'Request failed' },
                    }
                }
            }

            return data as ApiResponse<T>
        } catch (error) {
            console.error('API request failed:', error)
            return {
                success: false,
                error: { code: 'NETWORK_ERROR', message: 'Network request failed' },
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
            if (queryString) {
                url += `?${queryString}`
            }
        }
        return this.request<T>(url, { ...options, method: 'GET' })
    }

    async post<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<ApiResponse<T>> {
        const isFormData = body instanceof FormData;
        return this.request<T>(endpoint, {
            ...options,
            method: 'POST',
            body: isFormData ? (body as BodyInit) : (body ? JSON.stringify(body) : undefined),
        })
    }

    async patch<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<ApiResponse<T>> {
        const isFormData = body instanceof FormData;
        return this.request<T>(endpoint, {
            ...options,
            method: 'PATCH',
            body: isFormData ? (body as BodyInit) : (body ? JSON.stringify(body) : undefined),
        })
    }

    async put<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<ApiResponse<T>> {
        const isFormData = body instanceof FormData;
        return this.request<T>(endpoint, {
            ...options,
            method: 'PUT',
            body: isFormData ? (body as BodyInit) : (body ? JSON.stringify(body) : undefined),
        })
    }

    async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, { method: 'DELETE' })
    }
}

export const apiClient = new ApiClient(API_BASE_URL)
