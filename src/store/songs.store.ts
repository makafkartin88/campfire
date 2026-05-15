import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Song } from '../types'

interface SongsState {
  songs: Song[]
  isLoading: boolean
  setSongs: (songs: Song[]) => void
  addSong: (song: Song) => void
  updateSong: (song: Song) => void
  removeSong: (id: string) => void
  getSong: (id: string) => Song | undefined
  setLoading: (loading: boolean) => void
}

export const useSongsStore = create<SongsState>()(
  persist(
    (set, get) => ({
      songs: [],
      isLoading: false,
      setSongs: (songs) => set({ songs }),
      addSong: (song) => set((s) => ({ songs: [...s.songs, song] })),
      updateSong: (song) =>
        set((s) => ({ songs: s.songs.map((x) => (x.id === song.id ? song : x)) })),
      removeSong: (id) => set((s) => ({ songs: s.songs.filter((x) => x.id !== id) })),
      getSong: (id) => get().songs.find((x) => x.id === id),
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    { name: 'campfire-songs' },
  ),
)
