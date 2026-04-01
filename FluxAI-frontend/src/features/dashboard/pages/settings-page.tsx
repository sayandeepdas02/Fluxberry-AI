"use client";

import { useState } from "react";
import { useAuth } from "@/lib/context/auth-context";
import {
    ExternalLink,
    HelpCircle,
    MoreHorizontal,
    UserPlus,
    Zap,
} from "lucide-react";
import Link from "next/link";

export function SettingsPage() {
    const { user } = useAuth();
    const [workspaceName, setWorkspaceName] = useState(
        user?.organization?.name || "My Workspace"
    );

    const firstName = user?.firstName || "";
    const lastName = user?.lastName || "";
    const userName = firstName || lastName
        ? `${firstName} ${lastName}`.trim()
        : "User";
    const userEmail = user?.email || "user@fluxberryai.com";

    const getInitials = (name: string) =>
        name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

    const publicSlug = workspaceName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

    return (
        <div className="max-w-2xl space-y-8">

            <h1 className="text-[22px] tracking-tight">Settings</h1>

            {/* ── Profile ─────────────────────────────────────── */}
            <section className="space-y-3">
                <h2 className="text-[15px] font-semibold">Profile</h2>
                <div className="border border-border rounded-xl px-5 py-4 flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold shrink-0 select-none">
                        {getInitials(userName)}
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <p className="text-sm font-semibold leading-tight">{userName}</p>
                        <p className="text-xs text-blue-500 leading-tight">{userEmail}</p>
                    </div>
                </div>
            </section>

            {/* ── Workspace info ──────────────────────────────── */}
            <section className="space-y-3">
                <h2 className="text-[15px] font-semibold">Workspace info</h2>
                <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">

                    {/* Logo */}
                    <div className="flex items-center px-5 py-[14px]">
                        <span className="flex-1 text-sm text-foreground">Logo</span>
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold select-none">
                            {getInitials(workspaceName)}
                        </div>
                    </div>

                    {/* Name */}
                    <div className="flex items-center px-5 py-[14px]">
                        <span className="flex-1 text-sm text-foreground">Name</span>
                        <input
                            value={workspaceName}
                            onChange={(e) => setWorkspaceName(e.target.value)}
                            className="w-44 text-sm text-right text-foreground bg-transparent focus:outline-none focus:bg-muted/50 rounded px-2 py-0.5 transition-colors placeholder:text-muted-foreground"
                            placeholder="Workspace name"
                        />
                    </div>

                    {/* Public link */}
                    <div className="flex items-center px-5 py-[14px]">
                        <span className="flex-1 flex items-center gap-1.5 text-sm text-foreground">
                            Public link
                            <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />
                        </span>
                        <div className="flex items-center gap-2 border border-border rounded-md px-3 py-[6px]">
                            <span className="text-sm text-muted-foreground whitespace-nowrap">
                                fluxberryai.com/{publicSlug}
                            </span>
                            <button
                                onClick={() =>
                                    window.open(
                                        `https://fluxberryai.com/${publicSlug}`,
                                        "_blank"
                                    )
                                }
                                className="text-muted-foreground hover:text-foreground transition-colors ml-1"
                                aria-label="Open public link"
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    {/* Plan */}
                    <div className="flex items-center px-5 py-[14px]">
                        <span className="flex-1 text-sm text-foreground">Plan</span>
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground">Free</span>
                            <Link
                                href="/dashboard/pricing"
                                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors"
                            >
                                <Zap className="w-3 h-3" />
                                Upgrade
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Workspace users ─────────────────────────────── */}
            <section className="space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-[15px] font-semibold">Workspace users</h2>
                    <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-foreground text-background rounded-lg hover:opacity-90 transition-opacity">
                        <UserPlus className="w-3.5 h-3.5" />
                        Invite user
                    </button>
                </div>
                <div className="border border-border rounded-xl overflow-hidden">
                    <div className="flex items-center gap-3.5 px-5 py-4">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold shrink-0 select-none">
                            {getInitials(userName)}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                            <p className="text-sm font-medium leading-tight">
                                {userName}{" "}
                                <span className="text-muted-foreground font-normal">
                                    (owner)
                                </span>
                            </p>
                            <p className="text-xs text-blue-500 leading-tight">
                                {userEmail}
                            </p>
                        </div>
                        <div className="flex items-center gap-2.5 shrink-0">
                            <span className="text-xs text-muted-foreground">Admin</span>
                            <button className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                                <MoreHorizontal className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
