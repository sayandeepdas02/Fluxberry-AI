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

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        const token = getStoredToken()

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...options.headers,
        }

        // If body is FormData, remove Content-Type to let browser set boundary
        if (options.body instanceof FormData) {
            // Check if headers is an object or Headers instance
            if (headers && typeof headers === 'object' && !('delete' in headers)) {
                delete (headers as Record<string, string>)['Content-Type'];
            }
        }

        if (token) {
            (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
        }

        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                ...options,
                headers,
            })

            // ... rest is same
            const data = await response.json()

            if (!response.ok) {
                return {
                    success: false,
                    error: data.error || { code: 'UNKNOWN', message: 'Request failed' },
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
