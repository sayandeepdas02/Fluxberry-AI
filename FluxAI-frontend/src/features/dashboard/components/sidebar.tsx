"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
    Briefcase,
    ChevronDown,
    ExternalLink,
    Settings,
    LogOut,
    ShoppingBag,
    FileText,
    Activity,
    Check,
    Plus,
    Mail,
    Zap,
    CreditCard,
    Search,
    Clock,
    LayoutGrid
} from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/context/auth-context";
import { useSubscription } from "@/lib/subscription/subscription-context";
import { useOrganization } from "@/features/dashboard/hooks/use-organization";

const PLAN_LABELS: Record<string, string> = {
    FREE: "Free Plan",
    GROWTH: "Growth Plan",
    SCALE: "Scale Plan",
    ENTERPRISE: "Enterprise",
};

export function Sidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const { config, getTrialDaysRemaining, hasAccessToApp } = useSubscription();
    const { memberCount } = useOrganization();

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Get workspace name from user's organization or default
    const workspaceName = user?.organization?.name || "Workspace";
    const userEmail = user?.email || "user@fluxberryai.com";
    const firstName = user?.firstName || "";
    const lastName = user?.lastName || "";
    const userName = firstName || lastName ? `${firstName} ${lastName}`.trim() : "User";
    const orgSlug = user?.organization?.slug || "";
    const rawPlan = (user?.organization as any)?.plan as string | undefined;
    const currentPlan = rawPlan ? (PLAN_LABELS[rawPlan] ?? rawPlan) : "Free Plan";

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
        setIsDropdownOpen(false);
        logout();
    };

    const isActive = (path: string) => {
        if (path === "/dashboard") {
            return pathname === path;
        }
        return pathname?.startsWith(path);
    };

    // Mock workspaces — in a real app these come from the user object
    const workspaces = [
        { name: workspaceName, initials: getInitials(workspaceName), isActive: true },
    ];

    return (
        <div className="w-64 h-screen border-r border-line bg-background flex flex-col sticky top-0">
            {/* Trial Banner */}
            {config.trialActive && (
                <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-semibold text-primary">
                        Free Trial ({getTrialDaysRemaining()} days left)
                    </span>
                </div>
            )}

            {/* Header: Workspace with Dropdown */}
            <div className="p-4 pb-2 relative" ref={dropdownRef}>
                <div
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-3 mb-1 cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors"
                >
                    {/* Workspace avatar */}
                    <div className="w-8 h-8 rounded-none border border-line bg-primary shadow-none flex items-center justify-center text-primary-foreground text-xs shrink-0">
                        {getInitials(workspaceName)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                            <span className="font-semibold text-sm truncate">{workspaceName}</span>
                            <ChevronDown className={cn(
                                "w-4 h-4 text-muted-foreground transition-transform shrink-0",
                                isDropdownOpen && "rotate-180"
                            )} />
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{currentPlan}</p>
                    </div>
                </div>

                {/* Rich Dropdown Menu */}
                {isDropdownOpen && (
                    <div className="absolute left-2 right-2 top-[calc(100%-4px)] mt-1 bg-background border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                        {/* Profile header */}
                        <div className="p-3 flex items-center gap-3 border-b border-border">
                            <div className="w-10 h-10 rounded-none border border-line bg-primary flex items-center justify-center text-primary-foreground text-sm shrink-0">
                                {getInitials(userName)}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold truncate">{userName}</p>
                                <p className="text-xs text-muted-foreground truncate">{currentPlan}</p>
                            </div>
                        </div>

                        {/* Settings + Upgrade */}
                        <div className="p-2 flex gap-2 border-b border-border">
                            <Link
                                href="/dashboard/settings"
                                onClick={() => setIsDropdownOpen(false)}
                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-muted transition-colors"
                            >
                                <Settings className="w-3.5 h-3.5" />
                                Settings
                            </Link>
                            <Link
                                href="/dashboard/pricing"
                                onClick={() => setIsDropdownOpen(false)}
                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-foreground text-background rounded-lg hover:opacity-90 transition-opacity"
                            >
                                <Zap className="w-3.5 h-3.5" />
                                Upgrade
                            </Link>
                        </div>

                        {/* Workspaces / Accounts section */}
                        <div className="p-2 border-b border-border">
                            <p className="px-2 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                                {userEmail}
                            </p>
                            {workspaces.map((ws) => (
                                <button
                                    key={ws.name}
                                    className="w-full flex items-center gap-2.5 px-2 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
                                    onClick={() => setIsDropdownOpen(false)}
                                >
                                    <div className="w-6 h-6 rounded-none border border-line bg-primary flex items-center justify-center text-primary-foreground text-[10px] shrink-0">
                                        {ws.initials}
                                    </div>
                                    <span className="flex-1 text-left truncate font-medium text-sm">{ws.name}</span>
                                    {ws.isActive && <Check className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                                </button>
                            ))}
                            <button
                                disabled
                                title="Multiple workspaces coming soon"
                                className="w-full flex items-center gap-2.5 px-2 py-2 text-sm text-muted-foreground rounded-lg transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <Plus className="w-4 h-4" />
                                New workspace
                            </button>
                        </div>

                        {/* Actions */}
                        <div className="p-2">
                            <a
                                href="mailto:support@fluxberryai.com"
                                className="w-full flex items-center gap-2.5 px-2 py-2 text-sm text-muted-foreground rounded-lg hover:bg-muted hover:text-foreground transition-colors"
                                onClick={() => setIsDropdownOpen(false)}
                            >
                                <Mail className="w-4 h-4" />
                                support@fluxberryai.com
                            </a>
                            <Link
                                href="/dashboard/pricing"
                                onClick={() => setIsDropdownOpen(false)}
                                className="w-full flex items-center gap-2.5 px-2 py-2 text-sm text-muted-foreground rounded-lg hover:bg-muted hover:text-foreground transition-colors"
                            >
                                <CreditCard className="w-4 h-4" />
                                Billing &amp; Plans
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-2.5 px-2 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                Log out
                            </button>
                        </div>
                    </div>
                )}

                <div className="px-2 text-xs text-muted-foreground flex items-center gap-1.5">
                    <span>{currentPlan}</span>
                    {memberCount > 0 && (
                        <>
                            <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                            <span>{memberCount} {memberCount === 1 ? "Member" : "Members"}</span>
                        </>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-auto py-6 px-3 space-y-6">
                {/* Products Section */}
                <div>
                    <h3 className="px-2 text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                        Products
                    </h3>

                    <div className="space-y-4">
                        {/* Job Board */}
                        {hasAccessToApp('job_board') && (
                        <div className="space-y-1">
                            <button className="w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-foreground hover:text-foreground transition-colors group">
                                <Briefcase className="w-4 h-4" />
                                <span>Job Board</span>
                            </button>

                            <div className="ml-4 space-y-0.5 border-l border-border/50 pl-2">
                                <Link
                                    href="/dashboard"
                                    className={cn(
                                        "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors relative",
                                        isActive("/dashboard") && !pathname?.startsWith("/dashboard/onboarding") && !pathname?.startsWith("/dashboard/analytics") && !pathname?.startsWith("/dashboard/assessments")
                                            ? "text-primary font-semibold"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50 font-medium"
                                    )}
                                >
                                    {isActive("/dashboard") && !pathname?.startsWith("/dashboard/onboarding") && !pathname?.startsWith("/dashboard/analytics") && !pathname?.startsWith("/dashboard/assessments") && (
                                        <motion.div layoutId="sidebar-active" className="absolute inset-0 bg-primary/10 rounded-md -z-10" />
                                    )}
                                    Home
                                </Link>

                                <Link
                                    href="/dashboard/manage-jobs"
                                    className={cn(
                                        "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors relative",
                                        isActive("/dashboard/manage-jobs")
                                            ? "text-primary font-semibold"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50 font-medium"
                                    )}
                                >
                                    {isActive("/dashboard/manage-jobs") && (
                                        <motion.div layoutId="sidebar-active" className="absolute inset-0 bg-primary/10 rounded-md -z-10" />
                                    )}
                                    Manage Jobs
                                </Link>

                                <Link
                                    href="/dashboard/candidate-pool"
                                    className={cn(
                                        "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors relative",
                                        isActive("/dashboard/candidate-pool")
                                            ? "text-primary font-semibold"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50 font-medium"
                                    )}
                                >
                                    {isActive("/dashboard/candidate-pool") && (
                                        <motion.div layoutId="sidebar-active" className="absolute inset-0 bg-primary/10 rounded-md -z-10" />
                                    )}
                                    Candidate Pool
                                </Link>
                            </div>
                        </div>
                        )}

                        {/* Talent Prospect (AI Sourcing) */}
                        {hasAccessToApp('talent_prospect') && (
                        <div className="space-y-1">
                            <button className="w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-foreground hover:text-foreground transition-colors group">
                                <Search className="w-4 h-4 text-primary" />
                                <span>Talent Prospect</span>
                                <span className="ml-auto px-1.5 py-0.5 rounded border border-primary/30 bg-primary/10 text-[10px] text-primary uppercase tracking-wider">
                                    AI
                                </span>
                            </button>

                            <div className="ml-4 space-y-0.5 border-l border-border/50 pl-2">
                                <Link
                                    href="/dashboard/talent-prospect"
                                    className={cn(
                                        "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors relative",
                                        isActive("/dashboard/talent-prospect")
                                            ? "text-primary font-semibold"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50 font-medium"
                                    )}
                                >
                                    {isActive("/dashboard/talent-prospect") && (
                                        <motion.div layoutId="sidebar-active" className="absolute inset-0 bg-primary/10 rounded-md -z-10" />
                                    )}
                                    Global Search
                                </Link>
                            </div>
                        </div>
                        )}

                        {/* ATS Screening */}
                        {hasAccessToApp('ats_screening') && (
                        <div className="space-y-1">
                            <button className="w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-foreground hover:text-foreground transition-colors group">
                                <Activity className="w-4 h-4" />
                                <span>ATS Screening</span>
                            </button>

                            <div className="ml-4 space-y-0.5 border-l border-border/50 pl-2">
                                <Link
                                    href="/dashboard/ats-screening"
                                    className={cn(
                                        "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors relative",
                                        isActive("/dashboard/ats-screening")
                                            ? "text-primary font-semibold"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50 font-medium"
                                    )}
                                >
                                    {isActive("/dashboard/ats-screening") && (
                                        <motion.div layoutId="sidebar-active" className="absolute inset-0 bg-primary/10 rounded-md -z-10" />
                                    )}
                                    Overview
                                </Link>
                            </div>
                        </div>
                        )}

                        {/* Interview Automation */}
                        {hasAccessToApp('interview_agent') && (
                        <div className="space-y-1">
                            <button className="w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-foreground hover:text-foreground transition-colors group">
                                <ShoppingBag className="w-4 h-4" />
                                <span>Interview Automation</span>
                            </button>

                            <div className="ml-4 space-y-0.5 border-l border-border/50 pl-2">
                                <Link
                                    href="/dashboard/analytics"
                                    className={cn(
                                        "w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium rounded-md transition-colors",
                                        isActive("/dashboard/analytics")
                                            ? "text-primary bg-primary/10 font-semibold"
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
                                            ? "text-primary bg-primary/10 font-semibold"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                    )}
                                >
                                    Assessments
                                </Link>
                                <Link
                                    href="/dashboard/question-bank"
                                    className={cn(
                                        "w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium rounded-md transition-colors",
                                        isActive("/dashboard/question-bank")
                                            ? "text-primary bg-primary/10 font-semibold"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                    )}
                                >
                                    Question Bank
                                </Link>
                            </div>
                        </div>
                        )}

                        {/* Talent Onboarding */}
                        {hasAccessToApp('onboarding') && (
                        <div className="space-y-1">
                            <button className="w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-foreground hover:text-foreground transition-colors group">
                                <FileText className="w-4 h-4" />
                                <span>Talent Onboarding</span>
                            </button>

                            <div className="ml-4 space-y-0.5 border-l border-border/50 pl-2">
                                <Link
                                    href="/dashboard/onboarding/offers"
                                    className={cn(
                                        "w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium rounded-md transition-colors",
                                        isActive("/dashboard/onboarding/offers")
                                            ? "text-primary bg-primary/10 font-semibold"
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
                                            ? "text-primary bg-primary/10 font-semibold"
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
                                            ? "text-primary bg-primary/10 font-semibold"
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
                                            ? "text-primary bg-primary/10 font-semibold"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                    )}
                                >
                                    Templates
                                </Link>
                            </div>
                        </div>
                        )}

                        {/* App Market */}
                        <div className="space-y-1 mt-6 border-t border-line/50 pt-4">
                            <Link href="/dashboard/apps" className={cn("w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors group relative", isActive("/dashboard/apps") ? "text-primary font-semibold" : "text-foreground hover:bg-muted/50 font-medium")}>
                                {isActive("/dashboard/apps") && (
                                    <motion.div layoutId="sidebar-active" className="absolute inset-0 bg-primary/10 rounded-md -z-10" />
                                )}
                                <LayoutGrid className={cn("w-4 h-4", isActive("/dashboard/apps") ? "text-primary" : "text-foreground/70 group-hover:text-foreground")} />
                                <span>OS Marketplace</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-line space-y-4">
                {orgSlug ? (
                    <a
                        href={`/company/${orgSlug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ExternalLink className="w-4 h-4" />
                        <span>Public View</span>
                    </a>
                ) : (
                    <button
                        disabled
                        title="Set up your workspace slug to enable public view"
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <ExternalLink className="w-4 h-4" />
                        <span>Public View</span>
                    </button>
                )}

                <div className="flex items-center gap-2 px-2">
                    <img src="/favicon.png" alt="Fluxberry AI" className="w-5 h-5 rounded-[4px]" />
                    <span className="font-semibold text-sm">Fluxberry AI</span>
                </div>
            </div>
        </div>
    );
}
