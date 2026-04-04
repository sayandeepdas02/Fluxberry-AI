/* ═══════════════════════════════════════════════════
   SIDEBAR SECTION — Section label (e.g. "PRODUCTS")
   ═══════════════════════════════════════════════════ */

interface SidebarSectionProps {
  title: string;
  children: React.ReactNode;
}

export function SidebarSection({ title, children }: SidebarSectionProps) {
  return (
    <div className="space-y-1">
      <h3 className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
        {title}
      </h3>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}
