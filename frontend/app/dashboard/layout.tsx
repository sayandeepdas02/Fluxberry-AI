import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "../api/auth/[...nextauth]/route"
import { DashboardNav } from "@/components/dashboard/dashboard-nav"
import Link from "next/link"
import { TopNav } from "@/components/dashboard/top-nav"
import Image from "next/image"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await getServerSession(authOptions)

    if (!session) {
        redirect("/login")
    }

    return (
        <div className="flex min-h-screen bg-[#FAFAFA]">
            {/* Sidebar Desktop */}
            <aside className="hidden lg:flex flex-col w-[260px] fixed inset-y-0 z-50 bg-[#FDFCFC] border-r border-border/40">
                <div className="h-16 flex items-center px-6 border-b border-border/40">
                    <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-[16px] tracking-tight">
                        <div className="h-6 w-6 rounded bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                            <span className="text-white text-xs font-bold leading-none">AI</span>
                        </div>
                        Interview AI
                    </Link>
                </div>
                <div className="flex-1 overflow-y-auto py-6 px-4">
                    <DashboardNav />
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 lg:pl-[260px] flex flex-col min-h-screen">
                <TopNav />
                <div className="flex-1 w-full max-w-7xl mx-auto p-6 md:p-8 lg:p-10">
                    {children}
                </div>
            </main>
        </div>
    )
}
