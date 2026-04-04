"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Search, X, ArrowRight, Loader2, Users, Briefcase, FileText } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api/client";

/* ═══════════════════════════════════════════════════
   GLOBAL SEARCH — Real API search with debounced input
   Queries candidates + jobs + static page navigation
   ═══════════════════════════════════════════════════ */

interface SearchResult {
  id: string;
  type: "candidate" | "job" | "page";
  title: string;
  subtitle?: string;
  href?: string;
}

// Static page results for instant navigation
const PAGE_RESULTS: SearchResult[] = [
  { id: "p-home", type: "page", title: "Dashboard Home", subtitle: "Overview and KPIs", href: "/dashboard" },
  { id: "p-candidates", type: "page", title: "Candidates", subtitle: "View all candidates", href: "/dashboard/candidates" },
  { id: "p-jobs", type: "page", title: "Manage Jobs", subtitle: "View all active jobs", href: "/dashboard/jobs/manage" },
  { id: "p-pipeline", type: "page", title: "ATS Pipeline", subtitle: "Kanban board view", href: "/dashboard/ats/pipeline" },
  { id: "p-analytics", type: "page", title: "Analytics", subtitle: "Hiring metrics and insights", href: "/dashboard/analytics" },
  { id: "p-prospect", type: "page", title: "Talent Search", subtitle: "Source candidates", href: "/dashboard/talent-prospect/search" },
  { id: "p-campaigns", type: "page", title: "Campaigns", subtitle: "Outreach campaigns", href: "/dashboard/talent-prospect/campaigns" },
  { id: "p-ai-interview", type: "page", title: "AI Interview", subtitle: "Run AI interviews", href: "/dashboard/interviews/ai" },
  { id: "p-assessments", type: "page", title: "Assessments", subtitle: "Manage assessments", href: "/dashboard/interviews/assessments" },
  { id: "p-reports", type: "page", title: "Interview Reports", subtitle: "Evaluation reports", href: "/dashboard/interviews/reports" },
  { id: "p-inbox", type: "page", title: "Inbox", subtitle: "Notifications and updates", href: "/dashboard/inbox" },
  { id: "p-settings", type: "page", title: "Settings", subtitle: "Workspace settings", href: "/dashboard/settings" },
];

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced search handler — queries real APIs
  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    setSelectedIndex(0);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    if (!value.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    debounceTimerRef.current = setTimeout(async () => {
      const q = value.toLowerCase();
      const combined: SearchResult[] = [];

      // 1. Filter static pages
      const pageMatches = PAGE_RESULTS.filter(
        r => r.title.toLowerCase().includes(q) || r.subtitle?.toLowerCase().includes(q)
      );
      combined.push(...pageMatches);

      // 2. Search candidates from API
      try {
        const candidatesRes = await apiClient.get<any[]>('/candidates', { search: value, limit: '5' });
        const candidates = candidatesRes?.data || [];
        candidates.forEach((c: any) => {
          combined.push({
            id: `c-${c._id}`,
            type: "candidate",
            title: c.firstName ? `${c.firstName} ${c.lastName}` : c.email,
            subtitle: c.email,
            href: "/dashboard/candidates",
          });
        });
      } catch {
        // Silently fail — page results are still shown
      }

      // 3. Search jobs from API
      try {
        const jobsRes = await apiClient.get<any[]>('/jobs', { search: value, limit: '5' });
        const jobs = jobsRes?.data || [];
        jobs.forEach((j: any) => {
          combined.push({
            id: `j-${j._id}`,
            type: "job",
            title: j.title,
            subtitle: j.department || j.location || 'Job',
            href: `/dashboard/jobs/manage`,
          });
        });
      } catch {
        // Silently fail
      }

      setResults(combined);
      setIsSearching(false);
    }, 300);
  }, []);

  const handleNavigate = (result: SearchResult) => {
    if (result.href) router.push(result.href);
    onClose();
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      handleNavigate(results[selectedIndex]);
    }
  };

  const typeIcons: Record<string, React.ReactNode> = {
    candidate: <Users className="h-4 w-4" />,
    job: <Briefcase className="h-4 w-4" />,
    page: <FileText className="h-4 w-4" />,
  };

  const typeLabels: Record<string, string> = {
    candidate: "Candidates",
    job: "Jobs",
    page: "Pages",
  };

  // Group results by type
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.type]) acc[r.type] = [];
    acc[r.type].push(r);
    return acc;
  }, {});

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

          {/* Search panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="fixed left-1/2 top-[15%] z-50 w-full max-w-xl -translate-x-1/2"
          >
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xl shadow-black/30">
              {/* Search input */}
              <div className="flex items-center gap-3 border-b border-border px-4">
                <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => handleSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search candidates, jobs, pages…"
                  className="h-14 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                {isSearching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                <button
                  onClick={onClose}
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Results */}
              <div className="max-h-80 overflow-y-auto">
                {!isSearching && query && results.length === 0 && (
                  <div className="px-4 py-8 text-center">
                    <p className="text-sm text-muted-foreground">No results for &ldquo;{query}&rdquo;</p>
                  </div>
                )}

                {!isSearching && results.length > 0 && (
                  <div className="p-2">
                    {Object.entries(grouped).map(([type, items]) => (
                      <div key={type}>
                        <p className="mb-1 px-2 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                          {typeLabels[type] || type}
                        </p>
                        {items.map((result) => {
                          const globalIndex = results.indexOf(result);
                          return (
                            <button
                              key={result.id}
                              className={cn(
                                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors cursor-pointer",
                                globalIndex === selectedIndex
                                  ? "bg-primary/10 text-primary"
                                  : "text-foreground hover:bg-muted/50"
                              )}
                              onClick={() => handleNavigate(result)}
                              onMouseEnter={() => setSelectedIndex(globalIndex)}
                            >
                              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                                {typeIcons[result.type]}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">{result.title}</p>
                                {result.subtitle && (
                                  <p className="truncate text-xs text-muted-foreground">{result.subtitle}</p>
                                )}
                              </div>
                              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}

                {!query && (
                  <div className="px-4 py-6 text-center">
                    <p className="text-xs text-muted-foreground">
                      Start typing to search across candidates, jobs, and pages
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-border px-4 py-2">
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground/60">
                  <span className="flex items-center gap-1">
                    <kbd className="rounded border border-border px-1 py-0.5 text-[10px]">↑↓</kbd>
                    Navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="rounded border border-border px-1 py-0.5 text-[10px]">↵</kbd>
                    Open
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="rounded border border-border px-1 py-0.5 text-[10px]">esc</kbd>
                    Close
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
