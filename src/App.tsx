import { HashRouter, Routes, Route } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { HomePage } from './pages/HomePage'
import { SongPage } from './pages/SongPage'
import { ImportPage } from './pages/ImportPage'
import { useSongsStore } from './store/songs.store'
import { useFoldersStore } from './store/folders.store'
import songData from './data/songs.json'
import type { Song, Folder } from './types'

// One-time static data load
useSongsStore.getState().setSongs(songData.songs as Song[])
useFoldersStore.getState().setFolders(songData.folders as Folder[])

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="song/:id" element={<SongPage />} />
          <Route path="import" element={<ImportPage />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
