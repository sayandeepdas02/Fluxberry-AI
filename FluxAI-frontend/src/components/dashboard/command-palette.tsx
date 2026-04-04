"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  Settings,
  Users,
  Briefcase,
  BarChart3,
  Home,
  ArrowRight,
  Command,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════
   COMMAND PALETTE — Cmd+K quick navigation
   Foundation component — keyboard-driven navigation
   ═══════════════════════════════════════════════════ */

interface CommandItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  action?: () => void;
  group: string;
}

const COMMAND_ITEMS: CommandItem[] = [
  // Navigation
  { id: "home", label: "Go to Home", icon: <Home className="h-4 w-4" />, href: "/dashboard", group: "Navigation" },
  { id: "candidates", label: "Go to Candidates", icon: <Users className="h-4 w-4" />, href: "/dashboard/candidates", group: "Navigation" },
  { id: "jobs", label: "Manage Jobs", icon: <Briefcase className="h-4 w-4" />, href: "/dashboard/jobs/manage", group: "Navigation" },
  { id: "analytics", label: "View Analytics", icon: <BarChart3 className="h-4 w-4" />, href: "/dashboard/analytics", group: "Navigation" },
  { id: "settings", label: "Open Settings", icon: <Settings className="h-4 w-4" />, href: "/dashboard/settings", group: "Navigation" },
  { id: "inbox", label: "Open Inbox", icon: <Home className="h-4 w-4" />, href: "/dashboard/inbox", group: "Navigation" },

  // ATS & Pipeline
  { id: "pipeline", label: "ATS Pipeline (Kanban)", icon: <Briefcase className="h-4 w-4" />, href: "/dashboard/ats/pipeline", group: "ATS" },
  { id: "ats-candidates", label: "ATS Candidates", icon: <Users className="h-4 w-4" />, href: "/dashboard/ats/candidates", group: "ATS" },

  // Interviews
  { id: "ai-interview", label: "Run AI Interview", icon: <Search className="h-4 w-4" />, href: "/dashboard/interviews/ai", group: "Interviews" },
  { id: "assessments", label: "Manage Assessments", icon: <Briefcase className="h-4 w-4" />, href: "/dashboard/interviews/assessments", group: "Interviews" },
  { id: "question-bank", label: "Question Bank", icon: <Settings className="h-4 w-4" />, href: "/dashboard/interviews/question-bank", group: "Interviews" },
  { id: "live-interviews", label: "Live Interviews", icon: <Users className="h-4 w-4" />, href: "/dashboard/interviews/live", group: "Interviews" },
  { id: "reports", label: "Interview Reports", icon: <BarChart3 className="h-4 w-4" />, href: "/dashboard/interviews/reports", group: "Interviews" },

  // Talent Prospect
  { id: "search", label: "Search Prospects", icon: <Search className="h-4 w-4" />, href: "/dashboard/talent-prospect/search", group: "Talent Prospect" },
  { id: "lists", label: "Prospect Lists", icon: <Users className="h-4 w-4" />, href: "/dashboard/talent-prospect/lists", group: "Talent Prospect" },
  { id: "campaigns", label: "Outreach Campaigns", icon: <Briefcase className="h-4 w-4" />, href: "/dashboard/talent-prospect/campaigns", group: "Talent Prospect" },
  { id: "templates", label: "Email Templates", icon: <Settings className="h-4 w-4" />, href: "/dashboard/talent-prospect/templates", group: "Talent Prospect" },

  // Jobs
  { id: "create-job", label: "Create New Job", icon: <Briefcase className="h-4 w-4" />, href: "/dashboard/jobs/create", group: "Actions" },
  { id: "job-insights", label: "Job Insights", icon: <BarChart3 className="h-4 w-4" />, href: "/dashboard/jobs/insights", group: "Actions" },
  { id: "job-distribution", label: "Job Distribution", icon: <Briefcase className="h-4 w-4" />, href: "/dashboard/jobs/distribution", group: "Actions" },
  { id: "career-page", label: "Career Page", icon: <Home className="h-4 w-4" />, href: "/dashboard/career-page", group: "Actions" },
  { id: "referrals", label: "Referrals", icon: <Users className="h-4 w-4" />, href: "/dashboard/referrals", group: "Actions" },
];

interface DashboardCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DashboardCommandPalette({ isOpen, onClose }: DashboardCommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredItems = COMMAND_ITEMS.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  const groupedItems = filteredItems.reduce<Record<string, CommandItem[]>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  // Reset state when opened/closed
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filteredItems.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && filteredItems[selectedIndex]) {
        e.preventDefault();
        const item = filteredItems[selectedIndex];
        if (item.href) router.push(item.href);
        if (item.action) item.action();
        onClose();
      }
    },
    [filteredItems, selectedIndex, router, onClose]
  );

  // Close on escape
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) onClose();
    }
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="fixed left-1/2 top-[15%] z-50 w-full max-w-lg -translate-x-1/2"
          >
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xl shadow-black/30">
              {/* Input */}
              <div className="flex items-center gap-3 border-b border-border px-4">
                <Command className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelectedIndex(0);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a command or search…"
                  className="h-12 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                  autoFocus
                />
              </div>

              {/* Results */}
              <div className="max-h-72 overflow-y-auto p-2">
                {Object.entries(groupedItems).map(([group, items]) => (
                  <div key={group}>
                    <p className="mb-1 px-2 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                      {group}
                    </p>
                    {items.map((item) => {
                      const globalIndex = filteredItems.indexOf(item);
                      return (
                        <button
                          key={item.id}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors cursor-pointer",
                            globalIndex === selectedIndex
                              ? "bg-primary/10 text-primary"
                              : "text-foreground hover:bg-muted/50"
                          )}
                          onClick={() => {
                            if (item.href) router.push(item.href);
                            if (item.action) item.action();
                            onClose();
                          }}
                          onMouseEnter={() => setSelectedIndex(globalIndex)}
                        >
                          <span className="text-muted-foreground">{item.icon}</span>
                          <span className="flex-1">{item.label}</span>
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40" />
                        </button>
                      );
                    })}
                  </div>
                ))}

                {filteredItems.length === 0 && (
                  <div className="px-4 py-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      No commands found for &ldquo;{query}&rdquo;
                    </p>
                  </div>
                )}
              </div>

              {/* Footer hints */}
              <div className="flex items-center gap-3 border-t border-border px-4 py-2 text-[11px] text-muted-foreground/50">
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-border px-1 py-0.5 text-[10px]">↑↓</kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-border px-1 py-0.5 text-[10px]">↵</kbd>
                  Execute
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-border px-1 py-0.5 text-[10px]">esc</kbd>
                  Close
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
