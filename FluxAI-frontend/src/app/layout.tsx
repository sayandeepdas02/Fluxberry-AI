import type { Metadata } from "next";
import "../styles/globals.css";
import { fontSans, fontMono } from "@/lib/fonts";
import { AuthProvider } from "@/lib/context/auth-context";

export const metadata: Metadata = {
    title: "Fluxberry AI - Hire Smarter, Faster",
    description: "Fluxberry AI helps companies design better hiring funnels, automatically screen candidates, and hire high-quality talent.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={`${fontSans.variable} ${fontMono.variable}`}>
            <body>
                <AuthProvider>
                    {children}
                </AuthProvider>
            </body>
        </html>
    );
}
