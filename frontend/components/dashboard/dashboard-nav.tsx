"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Briefcase, LayoutDashboard, PlusCircle, Settings, Users } from "lucide-react"

export function DashboardNav() {
    const pathname = usePathname()

    const items = [
        {
            title: "Overview",
            href: "/dashboard",
            icon: LayoutDashboard,
        },
        {
            title: "My Jobs",
            href: "/dashboard/jobs",
            icon: Briefcase,
        },
        {
            title: "Candidates",
            href: "/dashboard/candidates",
            icon: Users,
        },
        {
            title: "Settings",
            href: "/dashboard/settings",
            icon: Settings,
        },
    ]

    return (
        <nav className="grid items-start gap-2">
            <div className="px-2 py-3 mb-2">
                <Link href="/dashboard/jobs/new">
                    <Button variant="gradient" className="w-full justify-start shadow-md hover:shadow-lg transition-all" size="default">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Job
                    </Button>
                </Link>
            </div>
            {items.map((item, index) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                    <Link
                        key={index}
                        href={item.href}
                        className="px-2"
                    >
                        <span
                            className={cn(
                                "group flex items-center rounded-xl px-4 py-3 text-[14px] font-medium transition-all duration-200",
                                isActive
                                    ? "bg-red-50 text-red-700 shadow-sm ring-1 ring-red-100"
                                    : "text-slate-500 hover:bg-slate-100/80 hover:text-slate-900"
                            )}
                        >
                            <Icon className={cn("mr-3 h-[18px] w-[18px] transition-colors", isActive ? "text-red-600" : "text-slate-400 group-hover:text-slate-600")} />
                            {item.title}
                        </span>
                    </Link>
                )
            })}
        </nav>
    )
}
