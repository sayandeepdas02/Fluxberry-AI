"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/lib/context/auth-context";
import { useOrganization, useUpdateWorkspace } from "@/features/dashboard/hooks/use-organization";
import { ExternalLink, HelpCircle, MoreHorizontal, UserPlus, Zap, Check, Loader2, Shield } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

const PLAN_LABELS: Record<string, string> = {
    FREE: "Free",
    GROWTH: "Growth",
    SCALE: "Scale",
    ENTERPRISE: "Enterprise",
};

const ROLE_LABELS: Record<string, string> = {
    OWNER: "Owner",
    ADMIN: "Admin",
    RECRUITER: "Recruiter",
    HIRING_MANAGER: "Hiring Manager",
    INTERVIEWER: "Interviewer",
};

function getInitials(name: string): string {
    return name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

export function SettingsPage() {
    const { user } = useAuth();
    const { members, memberCount, isLoading: membersLoading, error: membersError } = useOrganization();
    const updateWorkspace = useUpdateWorkspace();

    const [workspaceName, setWorkspaceName] = useState(
        user?.organization?.name || ""
    );
    const [nameDirty, setNameDirty] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const firstName = user?.firstName || "";
    const lastName = user?.lastName || "";
    const userName = firstName || lastName ? `${firstName} ${lastName}`.trim() : "User";
    const userEmail = user?.email || "";
    const orgSlug = user?.organization?.slug || "";
    const rawPlan = (user?.organization as any)?.plan as string | undefined;
    const planLabel = rawPlan ? (PLAN_LABELS[rawPlan] ?? rawPlan) : "Free";
    const currentUserRole = user?.organization?.role || "MEMBER";

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setWorkspaceName(e.target.value);
        setNameDirty(e.target.value !== (user?.organization?.name || ""));
    };

    const handleSaveName = async () => {
        if (!workspaceName.trim() || !nameDirty) return;
        await updateWorkspace.mutateAsync(workspaceName.trim());
        setNameDirty(false);
    };

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
                        <p className="text-xs text-muted-foreground leading-tight">{userEmail}</p>
                    </div>
                    <div className="ml-auto">
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
                            {ROLE_LABELS[currentUserRole] ?? currentUserRole}
                        </span>
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
                            {getInitials(workspaceName || userName)}
                        </div>
                    </div>

                    {/* Name — inline edit with save */}
                    <div className="flex items-center px-5 py-[14px] gap-2">
                        <span className="flex-1 text-sm text-foreground">Name</span>
                        <input
                            ref={inputRef}
                            value={workspaceName}
                            onChange={handleNameChange}
                            onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                            className="w-44 text-sm text-right text-foreground bg-transparent focus:outline-none focus:bg-muted/50 rounded px-2 py-0.5 transition-colors placeholder:text-muted-foreground"
                            placeholder="Workspace name"
                        />
                        {nameDirty && (
                            <button
                                onClick={handleSaveName}
                                disabled={updateWorkspace.isPending}
                                aria-label="Save workspace name"
                                className="flex items-center justify-center w-7 h-7 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 shrink-0"
                            >
                                {updateWorkspace.isPending ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <Check className="w-3.5 h-3.5" />
                                )}
                            </button>
                        )}
                    </div>

                    {/* Public link */}
                    <div className="flex items-center px-5 py-[14px]">
                        <span className="flex-1 flex items-center gap-1.5 text-sm text-foreground">
                            Public link
                            <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />
                        </span>
                        {orgSlug ? (
                            <div className="flex items-center gap-2 border border-border rounded-md px-3 py-[6px]">
                                <span className="text-sm text-muted-foreground whitespace-nowrap">
                                    /{orgSlug}
                                </span>
                                <button
                                    onClick={() => window.open(`/company/${orgSlug}`, "_blank")}
                                    className="text-muted-foreground hover:text-foreground transition-colors ml-1"
                                    aria-label="Open public link"
                                >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                        )}
                    </div>

                    {/* Plan */}
                    <div className="flex items-center px-5 py-[14px]">
                        <span className="flex-1 text-sm text-foreground">Plan</span>
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground">{planLabel}</span>
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
                    <h2 className="text-[15px] font-semibold">
                        Workspace users
                        {!membersLoading && memberCount > 0 && (
                            <span className="ml-2 text-xs text-muted-foreground font-normal">({memberCount})</span>
                        )}
                    </h2>
                    <button
                        disabled
                        title="Invite by email — coming soon"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-foreground text-background rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <UserPlus className="w-3.5 h-3.5" />
                        Invite user
                    </button>
                </div>

                <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
                    {membersLoading && (
                        <div className="flex items-center gap-3.5 px-5 py-4">
                            <Skeleton className="w-9 h-9 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-3.5 w-32" />
                                <Skeleton className="h-3 w-44" />
                            </div>
                        </div>
                    )}

                    {!membersLoading && membersError && (
                        <div className="px-5 py-4 text-sm text-destructive flex items-center gap-2">
                            <Shield className="w-4 h-4 shrink-0" />
                            <span>Could not load members</span>
                        </div>
                    )}

                    {!membersLoading && !membersError && members.length === 0 && (
                        <div className="px-5 py-4 text-sm text-muted-foreground">
                            No members found.
                        </div>
                    )}

                    {!membersLoading && members.map((member) => {
                        const memberName = `${member.firstName} ${member.lastName}`.trim() || member.email;
                        const isCurrentUser = member.email === userEmail;

                        return (
                            <div key={member._id} className="flex items-center gap-3.5 px-5 py-4">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold shrink-0 select-none">
                                    {getInitials(memberName)}
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                                    <p className="text-sm font-medium leading-tight truncate">
                                        {memberName}
                                        {isCurrentUser && (
                                            <span className="text-muted-foreground font-normal ml-1">(you)</span>
                                        )}
                                    </p>
                                    <p className="text-xs text-muted-foreground leading-tight truncate">
                                        {member.email}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2.5 shrink-0">
                                    <span className="text-xs text-muted-foreground">
                                        {ROLE_LABELS[member.role] ?? member.role}
                                    </span>
                                    <button
                                        disabled
                                        className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-40"
                                        title="User management coming soon"
                                    >
                                        <MoreHorizontal className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}
