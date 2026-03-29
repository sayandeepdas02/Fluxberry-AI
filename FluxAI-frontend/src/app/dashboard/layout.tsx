"use client";

import { Sidebar } from "@/features/dashboard/components/sidebar";
import { ProtectedRoute } from "@/lib/context/protected-route";
import { SubscriptionProvider } from "@/lib/subscription/subscription-context";
import { PageTransition } from "@/components/shared/page-transition";
import { CommandPalette } from "@/components/shared/command-palette";

export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <ProtectedRoute requireCompletedOnboarding={true}>
            <SubscriptionProvider>
                <div className="flex min-h-screen bg-background">
                    <Sidebar />
                    <main className="flex-1 overflow-y-auto h-screen relative bg-background">
                        <PageTransition>
                            {children}
                        </PageTransition>
                        <CommandPalette />
                    </main>
                </div>
            </SubscriptionProvider>
        </ProtectedRoute>
    );
}
