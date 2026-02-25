import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "../api/auth/[...nextauth]/route"
import { DashboardNav } from "@/components/dashboard/dashboard-nav"
import { UserNav } from "@/components/dashboard/user-nav"
import Link from "next/link"

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
        <div className="flex min-h-screen bg-background">
            {/* Sidebar Desktop */}
            <aside className="hidden lg:flex flex-col w-[240px] fixed inset-y-0 z-50 bg-card border-r border-border">
                <div className="h-[60px] flex items-center px-6 border-b border-border">
                    <Link href="/dashboard" className="font-semibold text-[16px] tracking-tight">
                        Interview AI
                    </Link>
                </div>
                <div className="flex-1 overflow-y-auto py-6 px-4">
                    <DashboardNav />
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 lg:pl-[240px] flex flex-col min-h-screen">
                {/* TopNav */}
                <header className="h-[60px] bg-card border-b border-border flex items-center justify-between px-6 sticky top-0 z-40">
                    <div className="lg:hidden flex items-center">
                        <Link href="/dashboard" className="font-semibold text-lg tracking-tight">
                            Interview AI
                        </Link>
                    </div>
                    <div className="hidden lg:block"></div>
                    <div className="flex flex-1 items-center justify-end space-x-4">
                        <UserNav />
                    </div>
                </header>

                <div className="flex-1 h-full w-full">
                    {children}
                </div>
            </main>
        </div>
    )
}
