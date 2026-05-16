import { useState } from 'react'
import type { Song } from '../../types'
import { parseSong } from '../../lib/chords/parser'
import { transposeContent } from '../../lib/chords/transposer'
import { SongLine } from './SongLine'
import { ChordDiagramBar } from './ChordDiagramBar'
import { useUiStore } from '../../store/ui.store'

interface Props {
  song: Song
  showDiagrams?: boolean
  fontSize?: number
}

export function SongView({ song, showDiagrams = true, fontSize = 16 }: Props) {
  const transposeOffset = useUiStore((s) => s.transposeOffset)
  const [diagramsOpen, setDiagramsOpen] = useState(showDiagrams)

  const content = transposeContent(song.content, transposeOffset)
  const lines = parseSong(content)

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-100">{song.title}</h1>
        {song.artist && <p className="text-stone-400 mt-1">{song.artist}</p>}
        {song.key && (
          <span className="inline-block mt-2 px-2 py-0.5 rounded text-xs font-mono bg-stone-800 text-fire-400 border border-stone-700">
            {transposeOffset !== 0
              ? transposeContent(`[${song.key}]`, transposeOffset).replace(/[[\]]/g, '')
              : song.key}
          </span>
        )}
      </div>

      {/* Chord diagrams toggle */}
      {lines.some((l) => l.chords.length > 0) && (
        <div className="mb-6">
          <button
            onClick={() => setDiagramsOpen((o) => !o)}
            className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-fire-400 transition-colors group"
          >
            <svg
              width="10" height="10" viewBox="0 0 10 10"
              className={`transition-transform duration-200 ${diagramsOpen ? 'rotate-90' : ''}`}
              fill="currentColor"
            >
              <path d="M3 1.5 L7.5 5 L3 8.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{diagramsOpen ? 'Skrýt diagramy' : 'Zobrazit diagramy akordů'}</span>
          </button>

          {diagramsOpen && (
            <div className="mt-5 border-t border-stone-800 pt-5">
              <ChordDiagramBar content={song.content} transposeOffset={transposeOffset} />
            </div>
          )}
        </div>
      )}

      {/* Lyrics */}
      <div className="mt-4 pb-32">
        {lines.map((line, i) => (
          <SongLine key={i} line={line} fontSize={fontSize} />
        ))}
      </div>
    </div>
  )
}
