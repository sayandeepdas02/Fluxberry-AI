"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { mainNavItems, productSections, bottomNavItems } from "@/config/navigation";
import { SidebarProfile } from "./sidebar-profile";
import { SidebarItem } from "./sidebar-item";
import { SidebarSection } from "./sidebar-section";
import { CollapsibleMenu } from "./collapsible-menu";
import { SidebarFooter } from "./sidebar-footer";
import { Separator } from "@/components/ui/separator";

/* ═══════════════════════════════════════════════════
   SIDEBAR — Main dashboard sidebar
   260px fixed width · Full height · Sticky
   ═══════════════════════════════════════════════════ */

export function DashboardSidebar() {
  return (
    <aside className="sticky top-0 z-30 flex h-screen w-[var(--sidebar-width)] shrink-0 flex-col border-r border-border bg-sidebar">
      {/* Profile / Workspace Switcher */}
      <SidebarProfile />

      <Separator className="opacity-50" />

      {/* Scrollable Navigation */}
      <ScrollArea className="flex-1 py-3">
        <div className="space-y-6 px-2">
          {/* Main navigation */}
          <div className="space-y-0.5">
            {mainNavItems.map((item) => (
              <SidebarItem
                key={item.href}
                label={item.label}
                href={item.href}
                icon={item.icon}
              />
            ))}
          </div>

          <Separator className="opacity-30" />

          {/* Products section */}
          <SidebarSection title="Products">
            {productSections.map((section) => (
              <CollapsibleMenu key={section.id} section={section} />
            ))}
          </SidebarSection>

          <Separator className="opacity-30" />

          {/* Bottom navigation */}
          <div className="space-y-0.5">
            {bottomNavItems.map((item) => (
              <SidebarItem
                key={item.href}
                label={item.label}
                href={item.href}
                icon={item.icon}
              />
            ))}
          </div>
        </div>
      </ScrollArea>

      {/* Footer */}
      <SidebarFooter />
    </aside>
  );
}
