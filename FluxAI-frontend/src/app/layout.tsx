import type { Metadata } from "next";
import "../styles/globals.css";
import { fontSans, fontMono, fontHeading } from "@/lib/fonts";
import { AuthProvider } from "@/lib/context/auth-context";
import { Toaster } from "sonner";
import { GoogleOAuthProvider } from "@react-oauth/google";

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
        <html lang="en" className={`${fontSans.variable} ${fontMono.variable} ${fontHeading.variable}`}>
            <body>
                <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
                    <AuthProvider>
                        {children}
                        <Toaster />
                    </AuthProvider>
                </GoogleOAuthProvider>
            </body>
        </html>
    );
}
