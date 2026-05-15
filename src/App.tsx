import { HashRouter, Routes, Route } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { HomePage } from './pages/HomePage'
import { SongPage } from './pages/SongPage'
import { EditSongPage } from './pages/EditSongPage'
import { useDrive } from './hooks/useDrive'

function DriveLoader({ children }: { children: React.ReactNode }) {
  useDrive() // Loads public songs on mount, initialises auth in background
  return <>{children}</>
}

export function App() {
  return (
    <HashRouter>
      <DriveLoader>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<HomePage />} />
            <Route path="song/:id" element={<SongPage />} />
            <Route path="edit" element={<EditSongPage />} />
            <Route path="edit/:id" element={<EditSongPage />} />
          </Route>
        </Routes>
      </DriveLoader>
    </HashRouter>
  )
}
