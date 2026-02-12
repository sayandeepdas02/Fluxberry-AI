"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
    Briefcase,
    ChevronRight,
    ExternalLink,
    UserPlus,
    Settings,
    LogOut,
    ShoppingBag,
    FileText,
    Workflow,
    Calendar,
    Activity
} from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/context/auth-context";

export function Sidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Get workspace name from user's organization or default
    const workspaceName = user?.organization?.name || "Workspace";

    // Generate initials for avatar
    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((word) => word[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = () => {
        router.push("/");
        setTimeout(() => {
            logout();
        }, 100);
    };

    const isActive = (path: string) => {
        if (path === "/dashboard") {
            return pathname === path;
        }
        return pathname?.startsWith(path);
    };

    return (
        <div className="w-64 h-screen border-r border-edge bg-background flex flex-col sticky top-0">
            {/* Header: Workspace with Dropdown */}
            <div className="p-4 pb-2 relative" ref={dropdownRef}>
                <div
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-3 mb-1 cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors"
                >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                        {getInitials(workspaceName)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm truncate">{workspaceName}</span>
                            <ChevronRight className={cn(
                                "w-4 h-4 text-muted-foreground transition-transform",
                                isDropdownOpen && "rotate-90"
                            )} />
                        </div>
                    </div>
                </div>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                    <div className="absolute left-2 right-2 top-full mt-1 bg-background border border-border rounded-lg shadow-lg z-50 overflow-hidden">
                        <div className="p-1">
                            <button
                                onClick={() => {
                                    setIsDropdownOpen(false);
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-md transition-colors"
                            >
                                <UserPlus className="w-4 h-4" />
                                <span>+ Invite</span>
                            </button>

                            <Link
                                href="/dashboard/settings"
                                onClick={() => setIsDropdownOpen(false)}
                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-md transition-colors"
                            >
                                <Settings className="w-4 h-4" />
                                <span>Settings</span>
                            </Link>

                            <Link
                                href="/dashboard/audit-logs"
                                onClick={() => setIsDropdownOpen(false)}
                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-md transition-colors"
                            >
                                <Activity className="w-4 h-4" />
                                <span>Audit Logs</span>
                            </Link>

                            <div className="h-px bg-border my-1" />

                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>
                )}

                <div className="px-2 text-xs text-muted-foreground flex items-center gap-1.5">
                    <span>Free Plan</span>
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                    <span>5 Members</span>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-auto py-6 px-3 space-y-6">
                {/* Products Section */}
                <div>
                    <h3 className="px-2 text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider font-mono">
                        Products
                    </h3>

                    <div className="space-y-4">
                        {/* Flux ATS (Expanded) */}
                        <div className="space-y-1">
                            <button className="w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-foreground hover:text-foreground transition-colors group">
                                <Briefcase className="w-4 h-4" />
                                <span>Flux ATS</span>
                            </button>

                            <div className="ml-4 space-y-0.5 border-l border-border/50 pl-2">
                                <Link
                                    href="/dashboard"
                                    className={cn(
                                        "w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium rounded-md transition-colors",
                                        isActive("/dashboard") && !pathname?.startsWith("/dashboard/onboarding") && !pathname?.startsWith("/dashboard/analytics") && !pathname?.startsWith("/dashboard/assessments")
                                            ? "text-foreground bg-muted"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                    )}
                                >
                                    Home
                                </Link>

                                <Link
                                    href="/dashboard/manage-jobs"
                                    className={cn(
                                        "w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium rounded-md transition-colors",
                                        isActive("/dashboard/manage-jobs")
                                            ? "text-foreground bg-muted"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                    )}
                                >
                                    Manage Jobs
                                </Link>

                                <Link
                                    href="/dashboard/candidate-pool"
                                    className={cn(
                                        "w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium rounded-md transition-colors",
                                        isActive("/dashboard/candidate-pool")
                                            ? "text-foreground bg-muted"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                    )}
                                >
                                    Candidate Pool
                                </Link>

                                <Link
                                    href="/dashboard/workflows"
                                    className={cn(
                                        "w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium rounded-md transition-colors",
                                        isActive("/dashboard/workflows")
                                            ? "text-foreground bg-muted"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                    )}
                                >
                                    Workflows
                                </Link>
                            </div>
                        </div>

                        {/* Flux Hire (Expanded) */}
                        <div className="space-y-1">
                            <button className="w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-foreground hover:text-foreground transition-colors group">
                                <ShoppingBag className="w-4 h-4" />
                                <span>Flux Hire</span>
                            </button>

                            <div className="ml-4 space-y-0.5 border-l border-border/50 pl-2">
                                <Link
                                    href="/dashboard/analytics"
                                    className={cn(
                                        "w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium rounded-md transition-colors",
                                        isActive("/dashboard/analytics")
                                            ? "text-foreground bg-muted"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                    )}
                                >
                                    Analytics
                                </Link>
                                <Link
                                    href="/dashboard/assessments"
                                    className={cn(
                                        "w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium rounded-md transition-colors",
                                        isActive("/dashboard/assessments")
                                            ? "text-foreground bg-muted"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                    )}
                                >
                                    Assessments
                                </Link>
                                <Link
                                    href="/dashboard/interviews"
                                    className={cn(
                                        "w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium rounded-md transition-colors",
                                        isActive("/dashboard/interviews")
                                            ? "text-foreground bg-muted"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                    )}
                                >
                                    <Calendar className="w-4 h-4" />
                                    Interviews
                                </Link>
                            </div>
                        </div>

                        {/* Onboarding (New) */}
                        <div className="space-y-1">
                            <button className="w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-foreground hover:text-foreground transition-colors group">
                                <FileText className="w-4 h-4" />
                                <span>Onboarding</span>
                            </button>

                            <div className="ml-4 space-y-0.5 border-l border-border/50 pl-2">
                                <Link
                                    href="/dashboard/onboarding/offers"
                                    className={cn(
                                        "w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium rounded-md transition-colors",
                                        isActive("/dashboard/onboarding/offers")
                                            ? "text-foreground bg-muted"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                    )}
                                >
                                    Offers
                                </Link>
                                <Link
                                    href="/dashboard/onboarding/active"
                                    className={cn(
                                        "w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium rounded-md transition-colors",
                                        isActive("/dashboard/onboarding/active")
                                            ? "text-foreground bg-muted"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                    )}
                                >
                                    Active
                                </Link>
                                <Link
                                    href="/dashboard/onboarding/completed"
                                    className={cn(
                                        "w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium rounded-md transition-colors",
                                        isActive("/dashboard/onboarding/completed")
                                            ? "text-foreground bg-muted"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                    )}
                                >
                                    Completed
                                </Link>
                                <Link
                                    href="/dashboard/onboarding/templates"
                                    className={cn(
                                        "w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium rounded-md transition-colors",
                                        isActive("/dashboard/onboarding/templates")
                                            ? "text-foreground bg-muted"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                    )}
                                >
                                    Templates
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-edge space-y-4">
                <button className="w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                    <ExternalLink className="w-4 h-4" />
                    <span>Public View</span>
                </button>

                <div className="flex items-center gap-2 px-2">
                    <div className="w-5 h-5 bg-orange-500 rounded flex items-center justify-center">
                        <span className="text-[10px] font-bold text-white">F</span>
                    </div>
                    <span className="font-semibold text-sm">Fluxberry AI</span>
                </div>
            </div>
        </div>
    );
}
