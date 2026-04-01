"use client";

import { usePathname } from "next/navigation";
import { Search, Sun, Bell, Command, RefreshCw } from "lucide-react";

export function DashboardHeader() {
    const pathname = usePathname();

    const getBreadcrumb = (): { parent: string; page: string } => {
        if (pathname?.startsWith("/dashboard/settings")) return { parent: "Profile", page: "Settings" };
        if (pathname?.startsWith("/dashboard/pricing")) return { parent: "Profile", page: "Pricing" };
        if (pathname?.startsWith("/dashboard/ats-screening")) return { parent: "Products", page: "ATS Screening" };
        if (pathname?.startsWith("/dashboard/analytics")) return { parent: "Products", page: "Analytics" };
        if (pathname?.startsWith("/dashboard/assessments")) return { parent: "Products", page: "Assessments" };
        if (pathname?.startsWith("/dashboard/onboarding")) return { parent: "Products", page: "Talent Onboarding" };
        if (pathname?.startsWith("/dashboard/manage-jobs")) return { parent: "Products", page: "Manage Jobs" };
        if (pathname?.startsWith("/dashboard/candidate-pool")) return { parent: "Products", page: "Candidate Pool" };
        return { parent: "Overview", page: "Dashboard" };
    };

    const { parent, page } = getBreadcrumb();

    return (
        <div className="border-b border-line bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-20 px-8 py-4 flex items-center justify-between">
            {/* Dynamic Breadcrumbs */}
            <div className="flex items-center gap-2.5 text-sm tracking-widest uppercase">
                <span className="text-muted-foreground/80">{parent}</span>
                <span className="text-muted-foreground/40">/</span>
                <span className="text-foreground font-semibold">{page}</span>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-5">
                <div className="relative group hidden md:flex">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Search anything..."
                        className="h-10 w-64 rounded-none border border-line bg-background pl-9 pr-14 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary shadow-none transition-all placeholder:text-muted-foreground"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <kbd className="pointer-events-none inline-flex h-6 items-center gap-1 rounded-none border border-line bg-muted/50 px-1.5 text-[10px] font-medium text-muted-foreground">
                            <Command className="w-3 h-3" /> K
                        </kbd>
                    </div>
                </div>
                
                {/* Icons */}
                <div className="flex items-center gap-2">
                    <button className="p-2 border border-transparent text-muted-foreground hover:border-line hover:bg-muted/30 transition-all cursor-pointer">
                        <Sun className="w-4 h-4" />
                    </button>
                    <button className="p-2 border border-transparent text-muted-foreground hover:border-line hover:bg-muted/30 transition-all cursor-pointer">
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <button className="p-2 border border-transparent text-muted-foreground hover:border-line hover:bg-muted/30 transition-all cursor-pointer relative">
                        <Bell className="w-4 h-4" />
                        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary ring-2 ring-background"></span>
                    </button>
                </div>
            </div>
        </div>
    );
}
