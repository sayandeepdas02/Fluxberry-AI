'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/context/auth-context'

interface ProtectedRouteProps {
    children: React.ReactNode
    redirectTo?: string
}

export function ProtectedRoute({ children, redirectTo = '/signin' }: ProtectedRouteProps) {
    const { isAuthenticated, isLoading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push(redirectTo)
        }
    }, [isAuthenticated, isLoading, router, redirectTo])

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
            </div>
        )
    }

    if (!isAuthenticated) {
        return null
    }

    return <>{children}</>
}

/**
 * HOC version for wrapping pages
 */
export function withAuth<P extends object>(
    Component: React.ComponentType<P>,
    redirectTo = '/signin'
) {
    return function AuthenticatedComponent(props: P) {
        return (
            <ProtectedRoute redirectTo={redirectTo}>
                <Component {...props} />
            </ProtectedRoute>
        )
    }
}
