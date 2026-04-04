/* ═══════════════════════════════════════════════════
   SIDEBAR FOOTER — Branding
   ═══════════════════════════════════════════════════ */

export function SidebarFooter() {
  return (
    <div className="flex items-center gap-2.5 border-t border-border px-5 py-3">
      <img
        src="/favicon.png"
        alt="Flexberry AI"
        className="h-5 w-5 rounded"
      />
      <span className="text-[12px] font-semibold text-muted-foreground">
        Flexberry AI
      </span>
      <span className="ml-auto text-[10px] text-muted-foreground/40">
        v2.0
      </span>
    </div>
  );
}
