"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Search, X, ArrowRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════
   GLOBAL SEARCH — Search overlay with debounced input
   Architecture ready for API integration
   ═══════════════════════════════════════════════════ */

interface SearchResult {
  id: string;
  type: "candidate" | "job" | "page";
  title: string;
  subtitle?: string;
}

// Mock results for foundation
const MOCK_RESULTS: SearchResult[] = [
  { id: "1", type: "page", title: "Dashboard Home", subtitle: "Navigate to home" },
  { id: "2", type: "page", title: "Manage Jobs", subtitle: "View all active jobs" },
  { id: "3", type: "page", title: "ATS Pipeline", subtitle: "View candidate pipeline" },
  { id: "4", type: "candidate", title: "No candidates yet", subtitle: "Start sourcing to see results" },
];

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced search handler
  const handleSearch = useCallback((value: string) => {
    setQuery(value);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!value.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    debounceTimerRef.current = setTimeout(() => {
      // Filter mock results — replace with real API call later
      const filtered = MOCK_RESULTS.filter(
        (r) =>
          r.title.toLowerCase().includes(value.toLowerCase()) ||
          r.subtitle?.toLowerCase().includes(value.toLowerCase())
      );
      setResults(filtered);
      setIsSearching(false);
    }, 300);
  }, []);

  const typeIcons = {
    candidate: "👤",
    job: "💼",
    page: "📄",
  };

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
                  placeholder="Search candidates, jobs, pages…"
                  className="h-14 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                <button
                  onClick={onClose}
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Results */}
              <div className="max-h-80 overflow-y-auto">
                {isSearching && (
                  <div className="px-4 py-8 text-center">
                    <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <p className="mt-2 text-xs text-muted-foreground">Searching…</p>
                  </div>
                )}

                {!isSearching && query && results.length === 0 && (
                  <div className="px-4 py-8 text-center">
                    <p className="text-sm text-muted-foreground">No results for &ldquo;{query}&rdquo;</p>
                  </div>
                )}

                {!isSearching && results.length > 0 && (
                  <div className="p-2">
                    {results.map((result) => (
                      <button
                        key={result.id}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted/50 cursor-pointer"
                        onClick={onClose}
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-sm">
                          {typeIcons[result.type]}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">{result.title}</p>
                          {result.subtitle && (
                            <p className="truncate text-xs text-muted-foreground">{result.subtitle}</p>
                          )}
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                      </button>
                    ))}
                  </div>
                )}

                {!query && (
                  <div className="px-4 py-6 text-center">
                    <p className="text-xs text-muted-foreground">
                      Start typing to search across your workspace
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
