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
        <nav className="grid items-start gap-3">
            <div className="px-2 py-2">
                <Link href="/dashboard/jobs/new">
                    <Button className="w-full justify-start" size="sm">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Job
                    </Button>
                </Link>
            </div>
            {items.map((item, index) => {
                const Icon = item.icon
                return (
                    <Link
                        key={index}
                        href={item.href}
                    >
                        <span
                            className={cn(
                                "group flex items-center rounded-lg px-4 py-[16px] text-[14px] font-medium transition-colors hover:bg-slate-50 hover:text-slate-900 border-l-[3px] border-transparent",
                                pathname === item.href
                                    ? "bg-primary/5 text-primary border-primary font-semibold"
                                    : "text-muted-foreground"
                            )}
                        >
                            <Icon className={cn("mr-3 h-[18px] w-[18px]", pathname === item.href ? "text-primary" : "text-muted-foreground group-hover:text-slate-900")} />
                            <span>{item.title}</span>
                        </span>
                    </Link>
                )
            })}
        </nav>
    )
}
