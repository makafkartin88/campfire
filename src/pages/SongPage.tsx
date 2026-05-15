import { useParams, Navigate } from 'react-router-dom'
import { TopBar } from '../components/layout/TopBar'
import { SongView } from '../components/songs/SongView'
import { useSongsStore } from '../store/songs.store'
import { useUiStore } from '../store/ui.store'
import { useEffect } from 'react'

export function SongPage() {
  const { id } = useParams<{ id: string }>()
  const getSong = useSongsStore((s) => s.getSong)
  const setTransposeOffset = useUiStore((s) => s.setTransposeOffset)

  const song = id ? getSong(id) : undefined

  useEffect(() => {
    setTransposeOffset(0)
  }, [id, setTransposeOffset])

  if (!song) return <Navigate to="/" replace />

  return (
    <div className="min-h-full flex flex-col">
      <TopBar song={song} showControls={true} />
      <div className="flex-1 px-4 py-6 lg:px-8">
        <SongView song={song} />
      </div>
    </div>
  )
}
