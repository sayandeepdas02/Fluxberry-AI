import { create } from 'zustand'

interface ProspectUIState {
    selectedProspectId: string | null
    isDrawerOpen: boolean
    selectedIds: Set<string>
    addToListModalOpen: boolean
    createListModalOpen: boolean
    createCampaignModalOpen: boolean

    setSelectedProspect: (id: string | null) => void
    setDrawerOpen: (open: boolean) => void
    toggleSelect: (id: string) => void
    selectAll: (ids: string[]) => void
    clearSelection: () => void
    setAddToListModalOpen: (open: boolean) => void
    setCreateListModalOpen: (open: boolean) => void
    setCreateCampaignModalOpen: (open: boolean) => void
}

export const useProspectStore = create<ProspectUIState>((set, get) => ({
    selectedProspectId: null,
    isDrawerOpen: false,
    selectedIds: new Set(),
    addToListModalOpen: false,
    createListModalOpen: false,
    createCampaignModalOpen: false,

    setSelectedProspect: (id) => set({ selectedProspectId: id, isDrawerOpen: !!id }),
    setDrawerOpen: (open) => set({ isDrawerOpen: open, ...(open === false ? { selectedProspectId: null } : {}) }),
    toggleSelect: (id) => {
        const next = new Set(get().selectedIds)
        next.has(id) ? next.delete(id) : next.add(id)
        set({ selectedIds: next })
    },
    selectAll: (ids) => set({ selectedIds: new Set(ids) }),
    clearSelection: () => set({ selectedIds: new Set() }),
    setAddToListModalOpen: (open) => set({ addToListModalOpen: open }),
    setCreateListModalOpen: (open) => set({ createListModalOpen: open }),
    setCreateCampaignModalOpen: (open) => set({ createCampaignModalOpen: open }),
}))
