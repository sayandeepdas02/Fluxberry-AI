import { create } from "zustand";

/* ═══════════════════════════════════════════════════
   SIDEBAR STORE — Zustand
   Manages sidebar UI state with localStorage persistence
   ═══════════════════════════════════════════════════ */

const STORAGE_KEY = "flexberry-sidebar-state";

interface SidebarPersistedState {
  isCollapsed: boolean;
}

function loadPersistedState(): SidebarPersistedState {
  if (typeof window === "undefined") {
    return { isCollapsed: false };
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  return { isCollapsed: false };
}

function persistState(state: SidebarPersistedState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

interface SidebarState {
  /** Which collapsible section is currently open (null = all closed) */
  openSection: string | null;
  /** Whether the sidebar is collapsed to icon-only mode */
  isCollapsed: boolean;
  /** Whether the sidebar is open on mobile */
  isMobileOpen: boolean;

  // Actions
  toggleSection: (sectionId: string) => void;
  setOpenSection: (sectionId: string | null) => void;
  setCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;
  setMobileOpen: (open: boolean) => void;
}

export const useSidebarStore = create<SidebarState>((set) => {
  const persisted = loadPersistedState();

  return {
    openSection: null,
    isCollapsed: persisted.isCollapsed,
    isMobileOpen: false,

    toggleSection: (sectionId: string) =>
      set((state) => ({
        openSection: state.openSection === sectionId ? null : sectionId,
      })),

    setOpenSection: (sectionId: string | null) =>
      set({ openSection: sectionId }),

    setCollapsed: (collapsed: boolean) => {
      persistState({ isCollapsed: collapsed });
      set({ isCollapsed: collapsed });
    },

    toggleCollapsed: () =>
      set((state) => {
        const newCollapsed = !state.isCollapsed;
        persistState({ isCollapsed: newCollapsed });
        return { isCollapsed: newCollapsed };
      }),

    setMobileOpen: (open: boolean) =>
      set({ isMobileOpen: open }),
  };
});
