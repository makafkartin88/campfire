import { ArrowLeft, Edit, Trash2, Menu, ChevronUp, ChevronDown } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useUiStore } from '../../store/ui.store'
import { AutoscrollControls } from '../autoscroll/AutoscrollControls'
import { useAutoscroll } from '../../hooks/useAutoscroll'
import type { Song } from '../../types'
import { removeSong } from '../../lib/drive/sync'

interface Props {
  song?: Song
  showControls?: boolean
}

export function TopBar({ song, showControls = false }: Props) {
  const { transposeOffset, setTransposeOffset, toggleSidebar } = useUiStore()
  const autoscroll = useAutoscroll()
  const navigate = useNavigate()

  async function handleDelete() {
    if (!song) return
    if (!confirm(`Smazat "${song.title}"?`)) return
    await removeSong(song)
    navigate('/')
  }

  return (
    <div className="sticky top-0 z-10 flex items-center gap-2 px-3 py-2 bg-stone-950/90 backdrop-blur border-b border-stone-800">
      {/* Sidebar toggle (mobile) */}
      <button
        onClick={toggleSidebar}
        className="text-stone-500 hover:text-stone-300 lg:hidden p-1"
      >
        <Menu size={18} />
      </button>

      {/* Back */}
      {song && (
        <Link to="/" className="text-stone-500 hover:text-stone-300 p-1">
          <ArrowLeft size={18} />
        </Link>
      )}

      {/* Title */}
      <div className="flex-1 min-w-0">
        {song ? (
          <span className="text-stone-300 text-sm font-medium truncate">{song.title}</span>
        ) : (
          <span className="text-stone-500 text-sm">Campfire</span>
        )}
      </div>

      {showControls && song && (
        <>
          {/* Transpose */}
          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={() => setTransposeOffset(transposeOffset - 1)}
              disabled={transposeOffset <= -11}
              className="p-1 text-stone-500 hover:text-stone-300 disabled:opacity-30"
              title="Půltón dolů"
            >
              <ChevronDown size={15} />
            </button>
            <span
              className={`w-8 text-center font-mono text-xs ${
                transposeOffset !== 0 ? 'text-fire-400' : 'text-stone-600'
              }`}
            >
              {transposeOffset > 0 ? `+${transposeOffset}` : transposeOffset}
            </span>
            <button
              onClick={() => setTransposeOffset(transposeOffset + 1)}
              disabled={transposeOffset >= 11}
              className="p-1 text-stone-500 hover:text-stone-300 disabled:opacity-30"
              title="Půltón nahoru"
            >
              <ChevronUp size={15} />
            </button>
            {transposeOffset !== 0 && (
              <button
                onClick={() => setTransposeOffset(0)}
                className="text-xs text-stone-600 hover:text-stone-400 px-1"
                title="Reset"
              >
                ↺
              </button>
            )}
          </div>

          {/* Autoscroll */}
          <AutoscrollControls autoscroll={autoscroll} />

          {/* Edit */}
          <Link
            to={`/edit/${song.id}`}
            className="p-1.5 text-stone-500 hover:text-stone-300 transition-colors"
            title="Upravit"
          >
            <Edit size={15} />
          </Link>

          {/* Delete */}
          <button
            onClick={handleDelete}
            className="p-1.5 text-stone-500 hover:text-red-400 transition-colors"
            title="Smazat"
          >
            <Trash2 size={15} />
          </button>
        </>
      )}
    </div>
  )
}
