import { create } from 'zustand'
import type { Folder } from '../types'

interface FoldersState {
  folders: Folder[]
  activeFolderId: string | null
  setFolders: (folders: Folder[]) => void
  setActiveFolderId: (id: string | null) => void
}

export const useFoldersStore = create<FoldersState>()((set) => ({
  folders: [],
  activeFolderId: null,
  setFolders: (folders) => set({ folders }),
  setActiveFolderId: (id) => set({ activeFolderId: id }),
}))
