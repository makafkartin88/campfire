import { Link } from 'react-router-dom'
import { FolderOpen, Folder, Music, Search, Plus } from 'lucide-react'
import { useFoldersStore } from '../../store/folders.store'
import { useSongsStore } from '../../store/songs.store'
import { useUiStore, type SortMode } from '../../store/ui.store'
import { SongList } from '../songs/SongList'

const SORT_TABS: { mode: SortMode; label: string }[] = [
  { mode: 'default', label: 'Pořadí' },
  { mode: 'title', label: 'A–Z' },
  { mode: 'artist', label: 'Interpret' },
]

export function Sidebar() {
  const { folders, activeFolderId, setActiveFolderId } = useFoldersStore()
  const songs = useSongsStore((s) => s.songs)
  const { searchQuery, setSearchQuery, sortMode, setSortMode } = useUiStore()

  const allCount = songs.length
  const folderCount = (folderId: string) =>
    songs.filter((s) => s.folderId === folderId).length

  return (
    <div className="flex flex-col h-full bg-stone-900 border-r border-stone-800">

      {/* Logo + import icon */}
      <div className="px-4 py-4 border-b border-stone-800 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-fire-500 text-xl">🔥</span>
          <span className="font-bold text-stone-100 text-lg tracking-tight">Campfire</span>
        </Link>
        <Link
          to="/import"
          title="Přidat píseň"
          className="p-1.5 rounded-md text-stone-500 hover:text-fire-400 hover:bg-stone-800 transition-colors"
        >
          <Plus size={16} />
        </Link>
      </div>

      {/* Search */}
      <div className="px-3 pt-3 pb-2">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-600" />
          <input
            type="text"
            placeholder="Hledat…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-stone-800/80 text-stone-200 text-sm pl-8 pr-3 py-1.5 rounded-md border border-stone-700/60 focus:outline-none focus:border-fire-600/70 placeholder-stone-600"
          />
        </div>
      </div>

      {/* Sort tabs */}
      <div className="px-3 pb-3 flex items-center gap-1">
        {SORT_TABS.map(({ mode, label }) => (
          <button
            key={mode}
            onClick={() => setSortMode(mode)}
            className={`rounded-full px-2.5 py-0.5 text-xs transition-colors ${
              sortMode === mode
                ? 'bg-stone-800 text-fire-400 font-medium'
                : 'text-stone-500 hover:text-stone-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Folder list */}
      <div className="flex-1 overflow-y-auto border-t border-stone-800">

        {/* "SLOŽKY" label */}
        <p className="text-[10px] uppercase tracking-widest text-stone-600 font-semibold px-4 pt-3 pb-1 select-none">
          Složky
        </p>

        <button
          onClick={() => setActiveFolderId(null)}
          className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors ${
            activeFolderId === null
              ? 'text-fire-400 bg-stone-800/60'
              : 'text-stone-400 hover:bg-stone-800/40 hover:text-stone-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Music size={13} />
            <span>Všechny písničky</span>
          </div>
          <span className="text-xs text-stone-600 tabular-nums">{allCount}</span>
        </button>

        {folders.map((folder) => {
          const isActive = activeFolderId === folder.id
          return (
            <button
              key={folder.id}
              onClick={() => setActiveFolderId(folder.id)}
              className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors ${
                isActive
                  ? 'text-fire-400 bg-stone-800/60'
                  : 'text-stone-400 hover:bg-stone-800/40 hover:text-stone-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {isActive ? <FolderOpen size={13} /> : <Folder size={13} />}
                <span className="truncate">{folder.name}</span>
              </div>
              <span className="text-xs text-stone-600 tabular-nums">{folderCount(folder.id)}</span>
            </button>
          )
        })}

        {/* Song list */}
        <div className="mt-2 border-t border-stone-800">
          <SongList />
        </div>
      </div>
    </div>
  )
}
