import type { Metadata } from "next";
import { Sidebar } from "@/features/dashboard/components/sidebar";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";

export const metadata: Metadata = {
    title: "Dashboard - FluxAI",
    description: "Recruiter dashboard and analytics",
};

export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />
            <main className="flex-1 overflow-y-auto h-screen relative">
                <DashboardHeader />

                {children}
            </main>
        </div>
    );
}
