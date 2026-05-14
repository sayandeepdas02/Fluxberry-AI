'use client'

// Auth is disabled for testing — ProtectedRoute is a passthrough.
// All route guards are no-ops until auth is re-enabled.

import React from 'react'

interface ProtectedRouteProps {
    children: React.ReactNode
    redirectTo?: string
    requireIncompleteOnboarding?: boolean
    requireCompletedOnboarding?: boolean
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    return <>{children}</>
}

export function withAuth<P extends object>(
    Component: React.ComponentType<P>,
    _redirectTo = '/signin'
) {
    return function AuthenticatedComponent(props: P) {
        return <Component {...props} />
    }
}
