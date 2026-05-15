import { create } from 'zustand'
import type { Song } from '../types'

interface SongsState {
  songs: Song[]
  setSongs: (songs: Song[]) => void
  getSong: (id: string) => Song | undefined
}

export const useSongsStore = create<SongsState>()((set, get) => ({
  songs: [],
  setSongs: (songs) => set({ songs }),
  getSong: (id) => get().songs.find((x) => x.id === id),
}))
