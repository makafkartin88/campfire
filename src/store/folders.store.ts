import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DriveFolder } from '../types'

interface FoldersState {
  folders: DriveFolder[]
  rootFolderId: string | null
  activeFolderId: string | null
  setFolders: (folders: DriveFolder[]) => void
  addFolder: (folder: DriveFolder) => void
  setRootFolderId: (id: string) => void
  setActiveFolderId: (id: string | null) => void
}

export const useFoldersStore = create<FoldersState>()(
  persist(
    (set) => ({
      folders: [],
      rootFolderId: null,
      activeFolderId: null,
      setFolders: (folders) => set({ folders }),
      addFolder: (folder) => set((s) => ({ folders: [...s.folders, folder] })),
      setRootFolderId: (id) => set({ rootFolderId: id }),
      setActiveFolderId: (id) => set({ activeFolderId: id }),
    }),
    { name: 'campfire-folders' },
  ),
)
