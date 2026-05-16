import { create } from 'zustand'

export type SortMode = 'default' | 'title' | 'artist'

interface UiState {
  sidebarOpen: boolean
  transposeOffset: number
  searchQuery: string
  sortMode: SortMode
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setTransposeOffset: (offset: number) => void
  setSearchQuery: (q: string) => void
  setSortMode: (mode: SortMode) => void
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  transposeOffset: 0,
  searchQuery: '',
  sortMode: 'title',
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setTransposeOffset: (offset) => set({ transposeOffset: offset }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setSortMode: (mode) => set({ sortMode: mode }),
}))
