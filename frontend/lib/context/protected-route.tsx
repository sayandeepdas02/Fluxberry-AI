'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/context/auth-context'

interface ProtectedRouteProps {
    children: React.ReactNode
    redirectTo?: string
    /** If true, user must NOT have completed onboarding to access this route */
    requireIncompleteOnboarding?: boolean
    /** If true, user MUST have completed onboarding to access this route */
    requireCompletedOnboarding?: boolean
}

export function ProtectedRoute({
    children,
    redirectTo = '/signin',
    requireIncompleteOnboarding = false,
    requireCompletedOnboarding = false,
}: ProtectedRouteProps) {
    const { user, isAuthenticated, isLoading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (isLoading) return

        // Not authenticated - redirect to signin
        if (!isAuthenticated) {
            router.replace(redirectTo)
            return
        }

        // For onboarding routes: if user already completed, go to dashboard
        if (requireIncompleteOnboarding && user?.onboardingCompleted) {
            router.replace('/dashboard')
            return
        }

        // For dashboard routes: if user hasn't completed onboarding, go to onboarding
        if (requireCompletedOnboarding && !user?.onboardingCompleted) {
            router.replace('/onboard/step-1')
            return
        }
    }, [isAuthenticated, isLoading, user, router, redirectTo, requireIncompleteOnboarding, requireCompletedOnboarding])

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

    // For onboarding routes: don't render if user already completed
    if (requireIncompleteOnboarding && user?.onboardingCompleted) {
        return null
    }

    // For dashboard routes: don't render if user hasn't completed onboarding
    if (requireCompletedOnboarding && !user?.onboardingCompleted) {
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
