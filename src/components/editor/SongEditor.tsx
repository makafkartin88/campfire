import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save, X } from 'lucide-react'
import type { Song } from '../../types'
import { useFoldersStore } from '../../store/folders.store'
import { saveSong } from '../../lib/drive/sync'
import { SongView } from '../songs/SongView'
import { PdfUploader } from '../pdf/PdfUploader'

interface Props {
  song?: Song
}

const DEFAULT_SONG: Omit<Song, 'id' | 'driveFileId' | 'driveParentFolderId' | 'createdAt' | 'updatedAt'> = {
  title: '',
  artist: '',
  folder: '',
  key: '',
  content: '',
  pdfDriveId: null,
}

const EXAMPLE = `[C]Twinkle, twinkle, [G]little star
[F]How I wonder [C]what you are
[F]Up above the [C]world so high
[G]Like a diamond [C]in the sky`

export function SongEditor({ song }: Props) {
  const navigate = useNavigate()
  const folders = useFoldersStore((s) => s.folders)

  const [form, setForm] = useState({
    title: song?.title ?? '',
    artist: song?.artist ?? '',
    folder: song?.folder ?? '',
    key: song?.key ?? '',
    content: song?.content ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<'edit' | 'preview' | 'pdf'>('edit')

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSave() {
    if (!form.title.trim()) { setError('Název je povinný'); return }
    if (!form.content.trim()) { setError('Text písně je povinný'); return }
    setError(null)
    setSaving(true)
    try {
      const folder = folders.find((f) => f.name === form.folder)
      const folderId = folder?.id ?? null

      const songData: Song = {
        ...(song ?? { ...DEFAULT_SONG, id: '', driveFileId: null, driveParentFolderId: null, createdAt: '', updatedAt: '' }),
        ...form,
        pdfDriveId: song?.pdfDriveId ?? null,
      }
      const saved = await saveSong(songData, folderId)
      navigate(`/song/${saved.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Chyba při ukládání')
    } finally {
      setSaving(false)
    }
  }

  function handlePdfExtracted(content: string, title: string) {
    setForm((f) => ({
      ...f,
      content,
      title: f.title || title,
    }))
    setTab('edit')
  }

  const previewSong: Song = {
    id: song?.id ?? 'preview',
    ...form,
    pdfDriveId: null,
    driveFileId: null,
    driveParentFolderId: null,
    createdAt: '',
    updatedAt: '',
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-stone-200">
          {song ? 'Upravit píseň' : 'Přidat píseň'}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-stone-400 hover:text-stone-200 border border-stone-700 rounded-md transition-colors"
          >
            <X size={14} /> Zrušit
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-fire-700 hover:bg-fire-600 text-white rounded-md transition-colors disabled:opacity-50"
          >
            <Save size={14} /> {saving ? 'Ukládám…' : 'Uložit'}
          </button>
        </div>
      </div>

      {/* Metadata fields */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="col-span-2">
          <label className="block text-xs text-stone-500 mb-1">Název *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="Název písničky"
            className="w-full bg-stone-800 text-stone-200 px-3 py-2 rounded-md border border-stone-700 focus:outline-none focus:border-fire-600 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-stone-500 mb-1">Interpret</label>
          <input
            type="text"
            value={form.artist}
            onChange={(e) => set('artist', e.target.value)}
            placeholder="Jméno interpreta"
            className="w-full bg-stone-800 text-stone-200 px-3 py-2 rounded-md border border-stone-700 focus:outline-none focus:border-fire-600 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-stone-500 mb-1">Tónina</label>
          <input
            type="text"
            value={form.key}
            onChange={(e) => set('key', e.target.value)}
            placeholder="např. C, Am, G"
            className="w-full bg-stone-800 text-stone-200 px-3 py-2 rounded-md border border-stone-700 focus:outline-none focus:border-fire-600 text-sm font-mono"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-xs text-stone-500 mb-1">Složka</label>
          <select
            value={form.folder}
            onChange={(e) => set('folder', e.target.value)}
            className="w-full bg-stone-800 text-stone-200 px-3 py-2 rounded-md border border-stone-700 focus:outline-none focus:border-fire-600 text-sm"
          >
            <option value="">— Bez složky —</option>
            {folders.map((f) => (
              <option key={f.id} value={f.name}>{f.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-3 border-b border-stone-800">
        {(['edit', 'preview', 'pdf'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm transition-colors border-b-2 -mb-px ${
              tab === t
                ? 'border-fire-500 text-fire-400'
                : 'border-transparent text-stone-500 hover:text-stone-300'
            }`}
          >
            {t === 'edit' ? 'Text' : t === 'preview' ? 'Náhled' : 'PDF'}
          </button>
        ))}
      </div>

      {tab === 'edit' && (
        <div className="space-y-2">
          <p className="text-xs text-stone-600">
            Akordy piš do hranatých závorek před slabiku: <code className="text-stone-400">[C]Tři [Am]čuníci</code>
          </p>
          <textarea
            value={form.content}
            onChange={(e) => set('content', e.target.value)}
            placeholder={EXAMPLE}
            rows={20}
            className="w-full bg-stone-900 text-stone-200 px-3 py-3 rounded-md border border-stone-700 focus:outline-none focus:border-fire-600 text-sm font-mono leading-relaxed resize-y"
          />
        </div>
      )}

      {tab === 'preview' && (
        <div className="bg-stone-900 rounded-lg p-4 border border-stone-800 min-h-48">
          {form.content ? (
            <SongView song={previewSong} showDiagrams={true} />
          ) : (
            <p className="text-stone-600 text-sm">Nejdřív zadej text písně.</p>
          )}
        </div>
      )}

      {tab === 'pdf' && (
        <div className="space-y-3">
          <PdfUploader onExtracted={handlePdfExtracted} />
          <p className="text-xs text-stone-600">
            Po extrakci přejdi na záložku "Text" a zkontroluj / uprav výsledek před uložením.
          </p>
        </div>
      )}

      {error && <p className="mt-3 text-red-400 text-sm">{error}</p>}
    </div>
  )
}
