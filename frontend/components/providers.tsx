"use client"

import { SessionProvider } from "next-auth/react"
import { AuthProvider } from "@/lib/context/auth-context"
import { GoogleOAuthProvider } from "@react-oauth/google"

export function Providers({ children }: { children: React.ReactNode }) {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "mock-client-id"
    return (
        <GoogleOAuthProvider clientId={clientId}>
            <AuthProvider>
                <SessionProvider>
                    {children}
                </SessionProvider>
            </AuthProvider>
        </GoogleOAuthProvider>
    )
}
