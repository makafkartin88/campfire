import { Link } from 'react-router-dom'
import { Music } from 'lucide-react'
import type { Song } from '../../types'
import { useSongsStore } from '../../store/songs.store'
import { useFoldersStore } from '../../store/folders.store'
import { useUiStore } from '../../store/ui.store'

export function SongList() {
  const songs = useSongsStore((s) => s.songs)
  const activeFolderId = useFoldersStore((s) => s.activeFolderId)
  const { searchQuery, sortMode } = useUiStore()

  // 1 — Filter
  const filtered = songs.filter((s) => {
    const matchFolder = !activeFolderId || s.folderId === activeFolderId
    const q = searchQuery.toLowerCase()
    const matchSearch =
      !q || s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q)
    return matchFolder && matchSearch
  })

  // 2 — Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortMode === 'title')
      return a.title.localeCompare(b.title, 'cs', { sensitivity: 'base' })
    if (sortMode === 'artist')
      return (
        (a.artist || '').localeCompare(b.artist || '', 'cs', { sensitivity: 'base' }) ||
        a.title.localeCompare(b.title, 'cs', { sensitivity: 'base' })
      )
    return 0 // 'default': insertion order from songs.json
  })

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-stone-500 text-sm gap-2">
        <Music size={24} className="opacity-40" />
        {searchQuery ? 'Žádné výsledky' : 'Žádné písničky'}
      </div>
    )
  }

  // 3 — Build flat list with section headers
  type Row = { type: 'header'; label: string } | { type: 'song'; song: Song }
  const rows: Row[] = []

  let lastKey = ''
  for (const song of sorted) {
    const key =
      sortMode === 'title'
        ? (song.title[0] ?? '').toUpperCase()
        : sortMode === 'artist'
          ? song.artist || '—'
          : ''

    if (sortMode !== 'default' && key !== lastKey) {
      rows.push({ type: 'header', label: key })
      lastKey = key
    }
    rows.push({ type: 'song', song })
  }

  return (
    <div>
      {rows.map((row, i) =>
        row.type === 'header' ? (
          <div
            key={`h-${i}`}
            className="flex items-center gap-2 px-4 pt-3 pb-1"
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-600 select-none">
              {row.label}
            </span>
            <div className="flex-1 h-px bg-stone-800" />
          </div>
        ) : (
          <SongRow key={row.song.id} song={row.song} />
        ),
      )}
    </div>
  )
}

function SongRow({ song }: { song: Song }) {
  return (
    <Link
      to={`/song/${song.id}`}
      className="flex items-center gap-3 px-4 py-2.5 hover:bg-stone-800/60 transition-colors group"
    >
      <div className="text-stone-700 group-hover:text-fire-500 transition-colors flex-shrink-0">
        <Music size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-stone-300 text-sm font-medium truncate leading-snug">
          {song.title}
        </div>
        {song.artist && (
          <div className="text-stone-600 text-xs truncate leading-snug">{song.artist}</div>
        )}
      </div>
      {song.key && (
        <span className="text-[10px] font-mono text-stone-700 flex-shrink-0">{song.key}</span>
      )}
    </Link>
  )
}
