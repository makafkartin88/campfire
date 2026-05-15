import { useParams } from 'react-router-dom'
import { TopBar } from '../components/layout/TopBar'
import { SongEditor } from '../components/editor/SongEditor'
import { useSongsStore } from '../store/songs.store'

export function EditSongPage() {
  const { id } = useParams<{ id: string }>()
  const getSong = useSongsStore((s) => s.getSong)
  const song = id ? getSong(id) : undefined

  return (
    <div className="min-h-full">
      <TopBar />
      <SongEditor song={song} />
    </div>
  )
}
