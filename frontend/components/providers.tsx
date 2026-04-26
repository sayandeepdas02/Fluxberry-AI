"use client"

import { SessionProvider } from "next-auth/react"
import { AuthProvider } from "@/lib/context/auth-context"
import { GoogleOAuthProvider } from "@react-oauth/google"

export function Providers({ children }: { children: React.ReactNode }) {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

    if (!clientId || clientId === "your_google_client_id_here") {
        console.warn("Google Client ID is missing or using placeholder. Google login will not work.")
    }

    return (
        <GoogleOAuthProvider clientId={clientId || "mock-client-id"}>
            <AuthProvider>
                <SessionProvider>
                    {children}
                </SessionProvider>
            </AuthProvider>
        </GoogleOAuthProvider>
    )
}
