import type { Metadata } from "next";
import "../styles/globals.css";
import { fontSans, fontMono } from "@/lib/fonts";

export const metadata: Metadata = {
    title: "FluxAI - Hire Smarter, Faster",
    description: "FluxAI helps companies design better hiring funnels, automatically screen candidates, and hire high-quality talent.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={`${fontSans.variable} ${fontMono.variable}`}>
            <body>{children}</body>
        </html>
    );
}
