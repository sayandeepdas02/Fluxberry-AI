"use client"

import { UserNav } from "@/components/dashboard/user-nav"
import { Bell, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function TopNav() {
    return (
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-border/40 bg-background/80 px-6 backdrop-blur-md">
            <div className="flex flex-1 items-center gap-4">
                {/* Search Bar matching Linear/Stripe style */}
                <div className="hidden shrink-0 items-center md:flex max-w-md w-full relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search jobs, candidates..."
                        className="w-full bg-white/50 pl-9 focus-visible:bg-white border-black/5 hover:border-black/10 transition-colors shadow-none h-9 rounded-lg"
                    />
                </div>
            </div>

            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
                    <Bell className="h-5 w-5" />
                    <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-background"></span>
                </Button>
                <div className="h-6 w-px bg-border/60 mx-1"></div>
                <UserNav />
            </div>
        </header>
    )
}
