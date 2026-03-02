"use client";

import { usePathname } from "next/navigation";

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
        return { parent: "Products", page: "Job Board" };
    };

    const { parent, page } = getBreadcrumb();

    return (
        <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-20 px-6 py-3 flex items-center justify-between">
            {/* Dynamic Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{parent}</span>
                <span>/</span>
                <span className="text-foreground font-medium">{page}</span>
            </div>

            {/* Right Actions Placeholder */}
            <div className="flex items-center gap-4">
                <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">🔍</span>
                    <input
                        type="text"
                        placeholder="Search"
                        className="h-9 w-64 rounded-md border border-input bg-muted/50 pl-8 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                </div>
                {/* Icons */}
                <div className="flex items-center gap-3 text-muted-foreground">
                    <button>☀</button>
                    <button>↺</button>
                    <button>🔔</button>
                    <button>📑</button>
                </div>
            </div>
        </div>
    );
}
