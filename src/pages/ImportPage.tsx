import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Wand2, Copy, Check } from 'lucide-react'
import { useFoldersStore } from '../store/folders.store'
import { convertToInline, looksLikeInlineFormat } from '../lib/chords/import-parser'
import { SongView } from '../components/songs/SongView'
import type { Song } from '../types'

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

export function ImportPage() {
  const folders = useFoldersStore((s) => s.folders)

  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [folderId, setFolderId] = useState<string>(folders[0]?.id ?? '')
  const [songKey, setSongKey] = useState('')
  const [rawInput, setRawInput] = useState('')
  const [content, setContent] = useState('')
  const [jsonCopied, setJsonCopied] = useState(false)
  const [contentCopied, setContentCopied] = useState(false)

  function handleConvert() {
    if (looksLikeInlineFormat(rawInput)) {
      setContent(rawInput.trim())
    } else {
      setContent(convertToInline(rawInput).trim())
    }
  }

  const previewSong: Song | null = useMemo(() => {
    if (!content.trim()) return null
    return {
      id: 'preview',
      title: title || '(bez názvu)',
      artist,
      folderId: folderId || null,
      key: songKey,
      content,
    }
  }, [content, title, artist, folderId, songKey])

  const jsonSnippet = useMemo(() => {
    const id = slugify(title) || 'new-song'
    const obj = {
      id,
      title,
      artist,
      folderId: folderId || null,
      key: songKey,
      content,
    }
    return JSON.stringify(obj, null, 2)
  }, [title, artist, folderId, songKey, content])

  function copyJson() {
    navigator.clipboard.writeText(jsonSnippet)
    setJsonCopied(true)
    setTimeout(() => setJsonCopied(false), 2000)
  }

  function copyContent() {
    navigator.clipboard.writeText(content)
    setContentCopied(true)
    setTimeout(() => setContentCopied(false), 2000)
  }

  const ready = title.trim() && content.trim() && folderId

  return (
    <div className="min-h-full">
      <div className="sticky top-0 z-10 flex items-center gap-2 px-3 py-2 bg-stone-950/90 backdrop-blur border-b border-stone-800">
        <Link to="/" className="text-stone-500 hover:text-stone-300 p-1">
          <ArrowLeft size={18} />
        </Link>
        <span className="text-stone-300 text-sm font-medium">Přidat píseň</span>
      </div>

      <div className="px-4 py-6 lg:px-8 max-w-5xl mx-auto space-y-6">
        {/* Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-stone-500 block mb-1">Název *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-stone-900 text-stone-100 px-3 py-2 rounded-md border border-stone-800 focus:outline-none focus:border-fire-600"
            />
          </div>
          <div>
            <label className="text-xs text-stone-500 block mb-1">Interpret</label>
            <input
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              className="w-full bg-stone-900 text-stone-100 px-3 py-2 rounded-md border border-stone-800 focus:outline-none focus:border-fire-600"
            />
          </div>
          <div>
            <label className="text-xs text-stone-500 block mb-1">Složka *</label>
            <select
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              className="w-full bg-stone-900 text-stone-100 px-3 py-2 rounded-md border border-stone-800 focus:outline-none focus:border-fire-600"
            >
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-stone-500 block mb-1">Tónina</label>
            <input
              type="text"
              value={songKey}
              onChange={(e) => setSongKey(e.target.value)}
              placeholder="např. Em, C, G"
              className="w-full bg-stone-900 text-stone-100 px-3 py-2 rounded-md border border-stone-800 focus:outline-none focus:border-fire-600"
            />
          </div>
        </div>

        {/* Raw input */}
        <div>
          <label className="text-xs text-stone-500 block mb-1">
            Surový text (akordy nad textem, ChordPro, nebo už ve formátu [Em]text)
          </label>
          <textarea
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            spellCheck={false}
            placeholder={'Em      D       Am   Em\nZas mě tu máš, nějak se mračíš\n...'}
            className="w-full h-48 bg-stone-900 text-stone-100 px-3 py-2 rounded-md border border-stone-800 focus:outline-none focus:border-fire-600 font-mono text-sm"
          />
          <button
            onClick={handleConvert}
            disabled={!rawInput.trim()}
            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-fire-700 hover:bg-fire-600 text-white text-sm rounded-md disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Wand2 size={14} />
            Převést
          </button>
        </div>

        {/* Editable converted result */}
        {content && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-stone-500">
                Výsledek (uprav pokud je něco špatně)
              </label>
              <button
                onClick={copyContent}
                className="text-xs text-stone-500 hover:text-stone-300 inline-flex items-center gap-1"
              >
                {contentCopied ? <Check size={12} /> : <Copy size={12} />}
                {contentCopied ? 'Zkopírováno' : 'Kopírovat'}
              </button>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              spellCheck={false}
              className="w-full h-48 bg-stone-900 text-stone-100 px-3 py-2 rounded-md border border-stone-800 focus:outline-none focus:border-fire-600 font-mono text-sm"
            />
          </div>
        )}

        {/* Live preview */}
        {previewSong && (
          <div>
            <label className="text-xs text-stone-500 block mb-2">Náhled</label>
            <div className="p-4 bg-stone-900 rounded-md border border-stone-800">
              <SongView song={previewSong} showDiagrams={false} />
            </div>
          </div>
        )}

        {/* JSON output */}
        {ready && (
          <div className="bg-amber-900/20 border border-amber-700/40 rounded-md p-4 space-y-2">
            <p className="text-sm text-amber-300 font-medium">Hotovo — pošli Claudemu tento JSON:</p>
            <pre className="bg-stone-950 p-3 rounded text-xs text-stone-300 overflow-x-auto whitespace-pre-wrap break-all">
              {jsonSnippet}
            </pre>
            <button
              onClick={copyJson}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-700 hover:bg-amber-600 text-white text-sm rounded-md"
            >
              {jsonCopied ? <Check size={14} /> : <Copy size={14} />}
              {jsonCopied ? 'Zkopírováno do schránky' : 'Kopírovat JSON'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
