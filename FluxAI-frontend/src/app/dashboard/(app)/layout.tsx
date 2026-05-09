"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { GlobalSearch } from "@/components/dashboard/global-search";
import { DashboardCommandPalette } from "@/components/dashboard/command-palette";
import { ErrorBoundary } from "@/components/shared/error-boundary";

/* ═══════════════════════════════════════════════════
   DASHBOARD APP LAYOUT
   Sidebar (260px) + Topbar (sticky) + Main content
   ═══════════════════════════════════════════════════ */

export default function DashboardAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Cmd+K keyboard shortcut
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    },
    []
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <DashboardSidebar />

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <Topbar
          onSearchClick={() => setIsSearchOpen(true)}
          onCommandPaletteOpen={() => setIsCommandPaletteOpen(true)}
        />

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <ErrorBoundary section="Dashboard">
            {children}
          </ErrorBoundary>
        </main>
      </div>

      {/* Overlays */}
      <GlobalSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
      <DashboardCommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </div>
  );
}
