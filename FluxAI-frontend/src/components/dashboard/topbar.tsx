"use client";

import { Search, Bell, Command, User } from "lucide-react";

/* ═══════════════════════════════════════════════════
   TOPBAR — Sticky dashboard topbar
   Search · Notifications · Profile
   ═══════════════════════════════════════════════════ */

interface TopbarProps {
  onSearchClick?: () => void;
  onCommandPaletteOpen?: () => void;
}

export function Topbar({ onSearchClick, onCommandPaletteOpen }: TopbarProps) {
  return (
    <header className="sticky top-0 z-20 flex h-[var(--topbar-height)] items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      {/* Left: Search */}
      <div className="flex items-center gap-4">
        <button
          onClick={onSearchClick}
          className="group flex h-9 w-72 items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 text-[13px] text-muted-foreground transition-all duration-200 hover:border-primary/30 hover:bg-muted/50 cursor-pointer"
        >
          <Search className="h-4 w-4 shrink-0 text-muted-foreground/60 transition-colors group-hover:text-muted-foreground" />
          <span className="flex-1 text-left">Search candidates, jobs…</span>
          <kbd className="pointer-events-none hidden items-center gap-0.5 rounded border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/60 sm:inline-flex">
            <Command className="h-3 w-3" />K
          </kbd>
        </button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        {/* Notification bell */}
        <button className="relative rounded-lg p-2 text-muted-foreground transition-colors duration-200 hover:bg-muted/50 hover:text-foreground cursor-pointer">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
        </button>

        {/* Profile avatar */}
        <button className="ml-2 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors duration-200 hover:bg-primary/20 cursor-pointer">
          <User className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
