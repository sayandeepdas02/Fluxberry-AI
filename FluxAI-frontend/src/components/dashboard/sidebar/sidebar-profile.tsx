"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
    ChevronDown,
    Settings,
    LogOut,
    Zap,
    Mail,
    CreditCard,
    Check,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/context/auth-context";

function getInitials(name: string): string {
    return name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

export function SidebarProfile() {
    const { user, organization, logout } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const workspaceName = organization?.name ?? user?.firstName ?? "Workspace";
    const userName = user ? `${user.firstName} ${user.lastName}`.trim() : "User";
    const userEmail = user?.email ?? "";
    const planName = (organization as any)?.plan ?? "Free";

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative p-3" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full items-center gap-3 rounded-lg p-2 transition-colors duration-200 hover:bg-sidebar-hover cursor-pointer"
            >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-[11px] font-bold text-primary-foreground">
                    {getInitials(workspaceName)}
                </div>
                <div className="min-w-0 flex-1 text-left">
                    <p className="truncate text-[13px] font-semibold text-foreground">{workspaceName}</p>
                    <p className="truncate text-[11px] text-muted-foreground capitalize">{planName} Plan</p>
                </div>
                <ChevronDown
                    className={cn(
                        "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                        isOpen && "rotate-180"
                    )}
                />
            </button>

            {isOpen && (
                <div className="absolute left-2 right-2 top-[calc(100%)] z-50 mt-1 overflow-hidden rounded-xl border border-border bg-card shadow-2xl shadow-black/20">
                    {/* Profile header */}
                    <div className="flex items-center gap-3 border-b border-border p-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                            {getInitials(userName)}
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">{userName}</p>
                            <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
                        </div>
                    </div>

                    {/* Quick actions */}
                    <div className="flex gap-2 border-b border-border p-2">
                        <Link
                            href="/dashboard/settings"
                            onClick={() => setIsOpen(false)}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted cursor-pointer"
                        >
                            <Settings className="h-3.5 w-3.5" />
                            Settings
                        </Link>
                        <Link
                            href="/pricing"
                            onClick={() => setIsOpen(false)}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 cursor-pointer"
                        >
                            <Zap className="h-3.5 w-3.5" />
                            Upgrade
                        </Link>
                    </div>

                    {/* Workspace row */}
                    <div className="border-b border-border p-2">
                        <p className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                            Workspace
                        </p>
                        <div className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm">
                            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-[10px] font-bold text-primary-foreground">
                                {getInitials(workspaceName)}
                            </div>
                            <span className="flex-1 truncate text-left text-sm font-medium text-foreground">
                                {workspaceName}
                            </span>
                            <Check className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        </div>
                    </div>

                    {/* Extra actions */}
                    <div className="p-2">
                        <a
                            href="mailto:support@fluxberryai.com"
                            className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
                        >
                            <Mail className="h-4 w-4" />
                            Contact support
                        </a>
                        <Link
                            href="/pricing"
                            onClick={() => setIsOpen(false)}
                            className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
                        >
                            <CreditCard className="h-4 w-4" />
                            Billing & Plans
                        </Link>
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                logout();
                            }}
                            className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10 cursor-pointer"
                        >
                            <LogOut className="h-4 w-4" />
                            Log out
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
