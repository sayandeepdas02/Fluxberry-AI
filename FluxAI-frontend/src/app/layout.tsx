import type { Metadata } from "next";
import "../styles/globals.css";
import { AuthProvider } from "@/lib/context/auth-context";
import { Toaster } from "sonner";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ReactQueryProvider } from "@/lib/query/query-client-provider";

export const metadata: Metadata = {
    title: "Fluxberry AI - AI Native Hiring Automation",
    description: "AI-native hiring platform automating sourcing, ATS, assessments, interviews, analytics, and onboarding in one system. Fluxberry AI helps startups & enterprises to hire best talent, faster and removing dependency on engineering team to hire tech talent.",
    icons: {
        icon: "/favicon.png",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" rel="stylesheet" />
            </head>
            <body>
                <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
                    <ReactQueryProvider>
                        <AuthProvider>
                            {children}
                            <Toaster richColors position="bottom-right" />
                        </AuthProvider>
                    </ReactQueryProvider>
                </GoogleOAuthProvider>
            </body>
        </html>
    );
}
