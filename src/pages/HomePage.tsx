import { TopBar } from '../components/layout/TopBar'
import { useSongsStore } from '../store/songs.store'
import { useUiStore } from '../store/ui.store'
import { Music } from 'lucide-react'

export function HomePage() {
  const songs = useSongsStore((s) => s.songs)
  const searchQuery = useUiStore((s) => s.searchQuery)

  return (
    <div className="min-h-full">
      <TopBar />
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Music size={40} className="text-stone-700 mb-4" />
        {songs.length === 0 && !searchQuery ? (
          <p className="text-stone-400 text-sm">Zatím žádné písničky</p>
        ) : (
          <p className="text-stone-500 text-sm">Vyber píseň v levém panelu</p>
        )}
      </div>
    </div>
  )
}
