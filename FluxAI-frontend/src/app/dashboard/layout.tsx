"use client";

import { Sidebar } from "@/features/dashboard/components/sidebar";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { ProtectedRoute } from "@/lib/context/protected-route";

export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <ProtectedRoute requireCompletedOnboarding={true}>
            <div className="flex min-h-screen bg-background">
                <Sidebar />
                <main className="flex-1 overflow-y-auto h-screen relative">
                    <DashboardHeader />
                    {children}
                </main>
            </div>
        </ProtectedRoute>
    );
}
