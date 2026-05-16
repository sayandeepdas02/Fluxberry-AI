"use client";

import { LogOut } from "lucide-react";
import { useAuth } from "@/lib/context/auth-context";

function getInitials(name: string): string {
    return name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "?";
}

export function SidebarFooter() {
    const { user, logout } = useAuth();

    const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : "User";
    const email = user?.email ?? "";

    return (
        <div className="flex items-center gap-2.5 border-t border-border px-4 py-3">
            {/* Avatar */}
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {getInitials(fullName)}
            </div>

            {/* Name + email */}
            <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-semibold text-foreground">{fullName}</p>
                <p className="truncate text-[10px] text-muted-foreground">{email}</p>
            </div>

            {/* Logout */}
            <button
                onClick={logout}
                title="Sign out"
                className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-sidebar-hover hover:text-destructive"
            >
                <LogOut className="h-3.5 w-3.5" />
            </button>
        </div>
    );
}
