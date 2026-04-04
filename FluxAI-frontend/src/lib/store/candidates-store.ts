import { create } from 'zustand'

interface CandidatesState {
    selectedCandidateId: string | null;
    isDrawerOpen: boolean;
    page: number;
    search: string;
    stage: string;

    // Multi-select for bulk actions
    selectedIds: Set<string>;
    focusedIndex: number;

    setSelectedCandidate: (id: string | null) => void;
    setDrawerOpen: (isOpen: boolean) => void;
    setPage: (page: number) => void;
    setSearch: (search: string) => void;
    setStage: (stage: string) => void;

    // Multi-select actions
    toggleSelect: (id: string) => void;
    selectAll: (ids: string[]) => void;
    clearSelection: () => void;
    setFocusedIndex: (index: number) => void;
}

export const useCandidatesStore = create<CandidatesState>((set, get) => ({
    selectedCandidateId: null,
    isDrawerOpen: false,
    page: 1,
    search: '',
    stage: '',
    selectedIds: new Set(),
    focusedIndex: -1,

    setSelectedCandidate: (id) => set({ selectedCandidateId: id, isDrawerOpen: !!id }),
    setDrawerOpen: (isOpen) => set({ isDrawerOpen: isOpen, ...(isOpen === false ? { selectedCandidateId: null } : {}) }),
    setPage: (page) => set({ page }),
    setSearch: (search) => set({ search, page: 1 }),
    setStage: (stage) => set({ stage, page: 1 }),

    toggleSelect: (id) => {
        const next = new Set(get().selectedIds)
        if (next.has(id)) {
            next.delete(id)
        } else {
            next.add(id)
        }
        set({ selectedIds: next })
    },
    selectAll: (ids) => set({ selectedIds: new Set(ids) }),
    clearSelection: () => set({ selectedIds: new Set() }),
    setFocusedIndex: (index) => set({ focusedIndex: index }),
}))
