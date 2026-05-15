import { create } from 'zustand'

interface UiState {
  sidebarOpen: boolean
  transposeOffset: number
  searchQuery: string
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setTransposeOffset: (offset: number) => void
  setSearchQuery: (q: string) => void
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  transposeOffset: 0,
  searchQuery: '',
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setTransposeOffset: (offset) => set({ transposeOffset: offset }),
  setSearchQuery: (q) => set({ searchQuery: q }),
}))
