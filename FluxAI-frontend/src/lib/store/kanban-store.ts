import { create } from 'zustand'

interface KanbanState {
    selectedJobId: string | null;
    setSelectedJobId: (id: string | null) => void;
}

export const useKanbanStore = create<KanbanState>((set) => ({
    selectedJobId: null,
    setSelectedJobId: (id) => set({ selectedJobId: id }),
}))
