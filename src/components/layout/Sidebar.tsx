import { Link } from 'react-router-dom'
import { FolderOpen, Folder, Music, Search, Plus } from 'lucide-react'
import { useFoldersStore } from '../../store/folders.store'
import { useSongsStore } from '../../store/songs.store'
import { useUiStore } from '../../store/ui.store'
import { SongList } from '../songs/SongList'

export function Sidebar() {
  const { folders, activeFolderId, setActiveFolderId } = useFoldersStore()
  const songs = useSongsStore((s) => s.songs)
  const { searchQuery, setSearchQuery } = useUiStore()

  const allCount = songs.length
  const folderCount = (folderId: string) =>
    songs.filter((s) => s.folderId === folderId).length

  return (
    <div className="flex flex-col h-full bg-stone-900 border-r border-stone-800">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-stone-800">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-fire-500 text-xl">🔥</span>
          <span className="font-bold text-stone-100 text-lg">Campfire</span>
        </Link>
      </div>

      {/* Search */}
      <div className="px-3 py-3 border-b border-stone-800">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-500" />
          <input
            type="text"
            placeholder="Hledat…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-stone-800 text-stone-200 text-sm pl-8 pr-3 py-1.5 rounded-md border border-stone-700 focus:outline-none focus:border-fire-600 placeholder-stone-600"
          />
        </div>
      </div>

      {/* Add song */}
      <div className="px-3 py-2 border-b border-stone-800">
        <Link
          to="/import"
          className="w-full flex items-center gap-2 px-3 py-2 bg-fire-700 hover:bg-fire-600 text-white text-sm rounded-md transition-colors font-medium"
        >
          <Plus size={15} />
          Přidat píseň
        </Link>
      </div>

      {/* Folder list */}
      <div className="flex-1 overflow-y-auto">
        <button
          onClick={() => setActiveFolderId(null)}
          className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
            activeFolderId === null
              ? 'bg-stone-800 text-fire-400'
              : 'text-stone-400 hover:bg-stone-800/50 hover:text-stone-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Music size={14} />
            Všechny písničky
          </div>
          <span className="text-xs text-stone-600">{allCount}</span>
        </button>

        {folders.map((folder) => {
          const isActive = activeFolderId === folder.id
          return (
            <button
              key={folder.id}
              onClick={() => setActiveFolderId(folder.id)}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'bg-stone-800 text-fire-400'
                  : 'text-stone-400 hover:bg-stone-800/50 hover:text-stone-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {isActive ? <FolderOpen size={14} /> : <Folder size={14} />}
                <span className="truncate">{folder.name}</span>
              </div>
              <span className="text-xs text-stone-600">{folderCount(folder.id)}</span>
            </button>
          )
        })}

        <div className="mt-2 border-t border-stone-800">
          <SongList />
        </div>
      </div>
    </div>
  )
}
