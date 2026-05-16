import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = [
    '/',
    '/signin',
    '/signup',
    '/pricing',
    '/jobs',
]

function isPublicPath(pathname: string): boolean {
    // Exact matches
    if (PUBLIC_PATHS.includes(pathname)) return true

    // Prefix matches for parameterised public routes
    const publicPrefixes = [
        '/jobs/',
        '/assessment/',
        '/offer/',
        '/onboarding/',     // candidate onboarding token pages
        '/onboard/',        // legacy alias
    ]
    return publicPrefixes.some(prefix => pathname.startsWith(prefix))
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Only protect dashboard routes
    if (!pathname.startsWith('/dashboard')) {
        return NextResponse.next()
    }

    // Allow public paths (shouldn't normally reach here, but be safe)
    if (isPublicPath(pathname)) {
        return NextResponse.next()
    }

    // Check for the refresh token cookie set by the backend auth controller.
    // The cookie is named "refreshToken" (httpOnly, set by POST /api/auth/login|signup|google).
    const hasRefreshToken = request.cookies.has('refreshToken')

    if (!hasRefreshToken) {
        const signInUrl = new URL('/signin', request.url)
        signInUrl.searchParams.set('returnUrl', pathname)
        return NextResponse.redirect(signInUrl)
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all dashboard routes.
         * Exclude Next.js internals and static files so they are never blocked.
         */
        '/dashboard/:path*',
    ],
}
