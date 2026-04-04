"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { isRouteActive } from "@/config/navigation";
import type { LucideIcon } from "lucide-react";

/* ═══════════════════════════════════════════════════
   SIDEBAR ITEM — Individual navigation link
   Active state: left border accent + subtle background
   ═══════════════════════════════════════════════════ */

interface SidebarItemProps {
  label: string;
  href: string;
  icon?: LucideIcon;
  badge?: string;
  isSubItem?: boolean;
}

export function SidebarItem({ label, href, icon: Icon, badge, isSubItem = false }: SidebarItemProps) {
  const pathname = usePathname();
  const active = isRouteActive(pathname, href);

  return (
    <Link
      href={href}
      className={cn(
        "group relative flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-all duration-200 cursor-pointer",
        isSubItem ? "pl-10" : "pl-3",
        active
          ? "bg-sidebar-active text-primary"
          : "text-muted-foreground hover:bg-sidebar-hover hover:text-foreground"
      )}
    >
      {/* Active left border indicator */}
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-primary" />
      )}

      {Icon && (
        <Icon
          className={cn(
            "h-4 w-4 shrink-0 transition-colors duration-200",
            active
              ? "text-primary"
              : "text-muted-foreground group-hover:text-foreground"
          )}
        />
      )}

      <span className="truncate">{label}</span>

      {badge && (
        <span className="ml-auto shrink-0 rounded border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
          {badge}
        </span>
      )}
    </Link>
  );
}
