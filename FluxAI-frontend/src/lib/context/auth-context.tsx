'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, AuthOrganization } from '@/lib/api/types'
import { setUnauthorizedHandler, setTokenRefreshedHandler } from '@/lib/api/client'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'

// ── Module-level token storage (not localStorage, not React state) ──────────
let _accessToken: string | null = null

export function getAccessToken(): string | null {
    return _accessToken
}

function setAccessToken(token: string): void {
    _accessToken = token
}

function clearAccessToken(): void {
    _accessToken = null
}

// ── Shared fetch helper (used before apiClient is importable here) ───────────
async function authFetch(path: string, options: RequestInit = {}): Promise<any> {
    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string>),
        },
    })
    return res.json().catch(() => ({ success: false }))
}

// ── Context types ─────────────────────────────────────────────────────────────
interface SignupInput {
    firstName: string
    lastName: string
    email: string
    password: string
    organizationName: string
}

interface AuthContextType {
    user: User | null
    organization: AuthOrganization | null
    isLoading: boolean
    isAuthenticated: boolean
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
    loginWithGoogle: (credential: string) => Promise<{ success: boolean; error?: string }>
    signup: (input: SignupInput) => Promise<{ success: boolean; error?: string }>
    logout: () => void
    refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ── Internal helpers ──────────────────────────────────────────────────────────
async function fetchMe(token: string): Promise<{ user: User; organization: AuthOrganization | null } | null> {
    const data = await authFetch('/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
    })
    if (data?.success && data?.data?.user) {
        return {
            user: data.data.user,
            organization: data.data.user.organization ?? null,
        }
    }
    return null
}

async function attemptRefresh(): Promise<string | null> {
    const data = await authFetch('/auth/refresh', { method: 'POST' })
    if (data?.success && data?.data?.tokens?.accessToken) {
        return data.data.tokens.accessToken
    }
    return null
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [organization, setOrganization] = useState<AuthOrganization | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Wire apiClient callbacks once on mount
    useEffect(() => {
        setUnauthorizedHandler(() => {
            clearAccessToken()
            setUser(null)
            setOrganization(null)
            if (typeof window !== 'undefined') {
                window.location.href = '/signin'
            }
        })
        setTokenRefreshedHandler((token: string) => {
            setAccessToken(token)
        })
    }, [])

    // Silently restore session on app mount
    useEffect(() => {
        let cancelled = false

        async function restoreSession() {
            const token = await attemptRefresh()
            if (cancelled) return

            if (token) {
                setAccessToken(token)
                const me = await fetchMe(token)
                if (me && !cancelled) {
                    setUser(me.user)
                    setOrganization(me.organization)
                }
            }
            if (!cancelled) setIsLoading(false)
        }

        restoreSession()
        return () => { cancelled = true }
    }, [])

    const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
        const data = await authFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        })

        if (!data?.success) {
            return { success: false, error: data?.error?.message ?? 'Invalid email or password' }
        }

        const token = data.data?.tokens?.accessToken
        if (!token) return { success: false, error: 'No token received' }

        setAccessToken(token)
        const me = await fetchMe(token)
        if (!me) return { success: false, error: 'Failed to load user profile' }

        setUser(me.user)
        setOrganization(me.organization)
        return { success: true }
    }

    const loginWithGoogle = async (credential: string): Promise<{ success: boolean; error?: string }> => {
        const data = await authFetch('/auth/google', {
            method: 'POST',
            body: JSON.stringify({ credential }),
        })

        if (!data?.success) {
            return { success: false, error: data?.error?.message ?? 'Google login failed' }
        }

        const token = data.data?.tokens?.accessToken
        if (!token) return { success: false, error: 'No token received' }

        setAccessToken(token)
        const me = await fetchMe(token)
        if (!me) return { success: false, error: 'Failed to load user profile' }

        setUser(me.user)
        setOrganization(me.organization)
        return { success: true }
    }

    const signup = async (input: SignupInput): Promise<{ success: boolean; error?: string }> => {
        const data = await authFetch('/auth/signup', {
            method: 'POST',
            body: JSON.stringify(input),
        })

        if (!data?.success) {
            return { success: false, error: data?.error?.message ?? 'Signup failed' }
        }

        const token = data.data?.tokens?.accessToken
        if (!token) return { success: false, error: 'No token received' }

        setAccessToken(token)
        const me = await fetchMe(token)
        if (!me) return { success: false, error: 'Failed to load user profile' }

        setUser(me.user)
        setOrganization(me.organization)
        return { success: true }
    }

    const logout = (): void => {
        // Fire-and-forget to clear httpOnly refresh cookie on backend
        authFetch('/auth/logout', { method: 'POST' }).catch(() => {})
        clearAccessToken()
        setUser(null)
        setOrganization(null)
        if (typeof window !== 'undefined') {
            window.location.href = '/signin'
        }
    }

    const refreshUser = async (): Promise<void> => {
        const token = _accessToken ?? await attemptRefresh()
        if (!token) return
        if (!_accessToken) setAccessToken(token)
        const me = await fetchMe(token)
        if (me) {
            setUser(me.user)
            setOrganization(me.organization)
        }
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                organization,
                isLoading,
                isAuthenticated: !!user,
                login,
                loginWithGoogle,
                signup,
                logout,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
