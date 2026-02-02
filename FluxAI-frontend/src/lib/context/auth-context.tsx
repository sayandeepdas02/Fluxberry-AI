'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User } from '@/lib/api/types'
import { authApi, LoginInput, SignupInput } from '@/lib/api/auth'
import { getStoredToken, clearStoredToken } from '@/lib/api/client'

interface AuthContextType {
    user: User | null
    isLoading: boolean
    isAuthenticated: boolean
    login: (input: LoginInput) => Promise<{ success: boolean; user?: User; error?: string }>
    signup: (input: SignupInput) => Promise<{ success: boolean; error?: string }>
    logout: () => void
    refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Check for existing session on mount
    useEffect(() => {
        const token = getStoredToken()
        if (token) {
            refreshUser()
        } else {
            setIsLoading(false)
        }
    }, [])

    const refreshUser = async () => {
        setIsLoading(true)
        try {
            const response = await authApi.getCurrentUser()
            if (response.success && response.data) {
                setUser(response.data)
            } else {
                // Token invalid, clear it
                clearStoredToken()
                setUser(null)
            }
        } catch {
            clearStoredToken()
            setUser(null)
        } finally {
            setIsLoading(false)
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

    const logout = () => {
        authApi.logout()
        setUser(null)
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: !!user,
                login,
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
