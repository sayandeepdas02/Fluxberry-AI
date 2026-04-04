"use client";

import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/stores/sidebar-store";
import { SidebarItem } from "./sidebar-item";
import { isSectionActive } from "@/config/navigation";
import type { NavSection } from "@/config/navigation";
import { useEffect } from "react";

/* ═══════════════════════════════════════════════════
   COLLAPSIBLE MENU — Accordion-style product section
   Only one section open at a time.
   Auto-expands based on current route.
   ═══════════════════════════════════════════════════ */

interface CollapsibleMenuProps {
  section: NavSection;
}

export function CollapsibleMenu({ section }: CollapsibleMenuProps) {
  const pathname = usePathname();
  const { openSection, toggleSection, setOpenSection } = useSidebarStore();

  const isOpen = openSection === section.id;
  const hasActiveChild = isSectionActive(pathname, section);
  const Icon = section.icon;

  // Auto-expand when navigating to a child route
  useEffect(() => {
    if (hasActiveChild && openSection !== section.id) {
      setOpenSection(section.id);
    }
    // Only run when pathname changes — don't track openSection to avoid loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <div className="space-y-0.5">
      {/* Section trigger */}
      <button
        onClick={() => toggleSection(section.id)}
        className={cn(
          "group flex w-full items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-all duration-200 cursor-pointer",
          hasActiveChild
            ? "text-foreground"
            : "text-muted-foreground hover:bg-sidebar-hover hover:text-foreground"
        )}
      >
        <Icon
          className={cn(
            "h-4 w-4 shrink-0 transition-colors duration-200",
            hasActiveChild
              ? "text-primary"
              : "text-muted-foreground group-hover:text-foreground"
          )}
        />

        <span className="flex-1 truncate text-left">{section.label}</span>

        {section.badge && (
          <span className="shrink-0 rounded border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
            {section.badge}
          </span>
        )}

        <ChevronRight
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-muted-foreground/50 transition-transform duration-200",
            isOpen && "rotate-90"
          )}
        />
      </button>

      {/* Collapsible children */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="relative ml-[18px] border-l border-border/50 py-1">
              {section.items.map((item) => (
                <SidebarItem
                  key={item.href}
                  label={item.label}
                  href={item.href}
                  isSubItem
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
