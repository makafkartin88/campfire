import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FolderOpen, Folder, Plus, Music, LogOut, LogIn, Search } from 'lucide-react'
import { useFoldersStore } from '../../store/folders.store'
import { useSongsStore } from '../../store/songs.store'
import { useUiStore } from '../../store/ui.store'
import { useAuthStore } from '../../store/auth.store'
import { signIn, signOut, isConfigured } from '../../lib/drive/auth'
import { createSongFolder } from '../../lib/drive/sync'
import { SongList } from '../songs/SongList'

export function Sidebar() {
  const { folders, rootFolderId, activeFolderId, setActiveFolderId } = useFoldersStore()
  const songs = useSongsStore((s) => s.songs)
  const { searchQuery, setSearchQuery } = useUiStore()
  const isSignedIn = useAuthStore((s) => s.isSignedIn)
  const isTokenValid = useAuthStore((s) => s.isTokenValid)
  const isOwner = isSignedIn && isTokenValid()
  const navigate = useNavigate()
  const [newFolderName, setNewFolderName] = useState('')
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [showNewFolder, setShowNewFolder] = useState(false)

  const allCount = songs.length
  const folderCount = (folderId: string) =>
    songs.filter((s) => s.driveParentFolderId === folderId).length

  async function handleCreateFolder() {
    if (!newFolderName.trim() || !rootFolderId) return
    setCreatingFolder(true)
    try {
      await createSongFolder(newFolderName.trim(), rootFolderId)
      setNewFolderName('')
      setShowNewFolder(false)
    } finally {
      setCreatingFolder(false)
    }
  }

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

      {/* Add song (owner only) */}
      {isOwner && (
        <div className="px-3 py-2 border-b border-stone-800">
          <button
            onClick={() => navigate('/edit')}
            className="w-full flex items-center gap-2 px-3 py-2 bg-fire-700 hover:bg-fire-600 text-white text-sm rounded-md transition-colors font-medium"
          >
            <Plus size={15} />
            Přidat píseň
          </button>
        </div>
      )}

      {/* Folder list */}
      <div className="flex-1 overflow-y-auto">
        {/* All songs */}
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

        {/* New folder (owner only) */}
        {isOwner && (
          showNewFolder ? (
            <div className="px-3 py-2 flex gap-1">
              <input
                autoFocus
                type="text"
                placeholder="Název složky"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateFolder()
                  if (e.key === 'Escape') setShowNewFolder(false)
                }}
                className="flex-1 bg-stone-800 text-stone-200 text-xs px-2 py-1.5 rounded border border-stone-700 focus:outline-none focus:border-fire-600"
              />
              <button
                onClick={handleCreateFolder}
                disabled={creatingFolder}
                className="px-2 py-1 bg-fire-700 text-white text-xs rounded hover:bg-fire-600 disabled:opacity-50"
              >
                OK
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowNewFolder(true)}
              className="w-full flex items-center gap-2 px-4 py-2 text-xs text-stone-600 hover:text-stone-400 transition-colors"
            >
              <Plus size={12} />
              Nová složka
            </button>
          )
        )}

        {/* Song list */}
        <div className="mt-2 border-t border-stone-800">
          <SongList />
        </div>
      </div>

      {/* Auth footer — only shown when Google credentials are configured */}
      {isConfigured() && (
        <div className="border-t border-stone-800">
          {isOwner ? (
            <button
              onClick={signOut}
              className="w-full flex items-center gap-2 px-4 py-3 text-stone-600 hover:text-stone-400 text-xs transition-colors"
            >
              <LogOut size={13} />
              Odhlásit se
            </button>
          ) : (
            <button
              onClick={signIn}
              className="w-full flex items-center gap-2 px-4 py-3 text-stone-600 hover:text-fire-400 text-xs transition-colors"
              title="Přihlásit se pro přidávání a editaci písní"
            >
              <LogIn size={13} />
              Přihlásit se (editace)
            </button>
          )}
        </div>
      )}
    </div>
  )
}
