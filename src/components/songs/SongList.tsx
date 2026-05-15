import { Link } from 'react-router-dom'
import { Music } from 'lucide-react'
import type { Song } from '../../types'
import { useSongsStore } from '../../store/songs.store'
import { useFoldersStore } from '../../store/folders.store'
import { useUiStore } from '../../store/ui.store'

export function SongList() {
  const songs = useSongsStore((s) => s.songs)
  const activeFolderId = useFoldersStore((s) => s.activeFolderId)
  const searchQuery = useUiStore((s) => s.searchQuery)

  const filtered = songs.filter((s) => {
    const matchFolder = !activeFolderId || s.folderId === activeFolderId
    const q = searchQuery.toLowerCase()
    const matchSearch =
      !q || s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q)
    return matchFolder && matchSearch
  })

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-stone-500 text-sm gap-2">
        <Music size={24} className="opacity-40" />
        {searchQuery ? 'Žádné výsledky' : 'Žádné písničky'}
      </div>
    )
  }

  return (
    <div className="divide-y divide-stone-800">
      {filtered.map((song) => (
        <SongRow key={song.id} song={song} />
      ))}
    </div>
  )
}

function SongRow({ song }: { song: Song }) {
  return (
    <Link
      to={`/song/${song.id}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-stone-800/60 transition-colors group"
    >
      <div className="text-stone-600 group-hover:text-fire-500 transition-colors">
        <Music size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-stone-200 text-sm font-medium truncate">{song.title}</div>
        {song.artist && (
          <div className="text-stone-500 text-xs truncate">{song.artist}</div>
        )}
      </div>
      {song.key && (
        <span className="text-xs font-mono text-stone-600 flex-shrink-0">{song.key}</span>
      )}
    </Link>
  )
}
