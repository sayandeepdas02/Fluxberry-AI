'use client'

import { createContext, useContext, useEffect, useCallback, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@/lib/api/types'
import { authApi, LoginInput, SignupInput } from '@/lib/api/auth'
import { getStoredToken, clearStoredToken, setUnauthorizedHandler } from '@/lib/api/client'

interface AuthContextType {
    user: User | null
    isLoading: boolean
    isAuthenticated: boolean
    login: (input: LoginInput) => Promise<{ success: boolean; user?: User; error?: string }>
    googleLogin: (credential: string) => Promise<{ success: boolean; user?: User; error?: string }>
    signup: (input: SignupInput) => Promise<{ success: boolean; error?: string }>
    logout: () => void
    refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()

    const logout = useCallback(async () => {
        await authApi.logout()
        setUser(null)
        router.push('/signin')
    }, [router])

    const refreshUser = useCallback(async () => {
        setIsLoading(true)
        try {
            const response = await authApi.getCurrentUser()
            if (response.success && response.data) {
                setUser(response.data)
            } else {
                // Token invalid or expired — clear and redirect
                clearStoredToken()
                setUser(null)
            }
        } catch {
            clearStoredToken()
            setUser(null)
        } finally {
            setIsLoading(false)
        }
    }, [])

    // Check for existing session on mount
    useEffect(() => {
        const token = getStoredToken()
        if (token) {
            refreshUser()
        } else {
            setIsLoading(false)
        }
    }, [refreshUser])

    // Wire the API client's unauthorized callback to our logout flow.
    // This fires whenever any API call receives a 401 that isn't a token
    // refresh — so the user is never stuck in an expired-token state.
    useEffect(() => {
        setUnauthorizedHandler(() => {
            if (getStoredToken()) {
                logout()
            }
        })
    }, [logout])

    const googleLogin = async (credential: string) => {
        const response = await authApi.googleLogin(credential)

        if (response.success && response.data) {
            setUser(response.data.user)
            return { success: true, user: response.data.user }
        }

        return {
            success: false,
            error: response.error?.message || 'Google Login failed'
        }
    }

    const login = async (input: LoginInput) => {
        const response = await authApi.login(input)

        if (response.success && response.data) {
            setUser(response.data.user)
            return { success: true, user: response.data.user }
        }

        return {
            success: false,
            error: response.error?.message || 'Login failed'
        }
    }

    const signup = async (input: SignupInput) => {
        const response = await authApi.signup(input)

        if (response.success && response.data) {
            setUser(response.data.user)
            return { success: true }
        }

        return {
            success: false,
            error: response.error?.message || 'Signup failed'
        }
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: !!user,
                login,
                googleLogin,
                signup,
                logout,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
