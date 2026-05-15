import { TopBar } from '../components/layout/TopBar'
import { useSongsStore } from '../store/songs.store'
import { useUiStore } from '../store/ui.store'
import { useAuthStore } from '../store/auth.store'
import { Music } from 'lucide-react'
import { Link } from 'react-router-dom'

export function HomePage() {
  const songs = useSongsStore((s) => s.songs)
  const isLoading = useSongsStore((s) => s.isLoading)
  const searchQuery = useUiStore((s) => s.searchQuery)
  const isSignedIn = useAuthStore((s) => s.isSignedIn)
  const isTokenValid = useAuthStore((s) => s.isTokenValid)
  const isOwner = isSignedIn && isTokenValid()

  return (
    <div className="min-h-full">
      <TopBar />
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Music size={40} className="text-stone-700 mb-4" />
        {isLoading ? (
          <p className="text-stone-500">Načítám písničky z Google Drive…</p>
        ) : songs.length === 0 && !searchQuery ? (
          <div className="space-y-3">
            <p className="text-stone-400 text-sm">Zatím žádné písničky</p>
            {isOwner && (
              <Link
                to="/edit"
                className="inline-block px-4 py-2 bg-fire-700 hover:bg-fire-600 text-white text-sm rounded-md transition-colors"
              >
                Přidat první píseň
              </Link>
            )}
          </div>
        ) : (
          <p className="text-stone-500 text-sm">
            Vyber píseň v levém panelu
          </p>
        )}
      </div>
    </div>
  )
}
