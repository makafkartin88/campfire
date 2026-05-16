import { ChordDiagram } from '../chord-diagram/ChordDiagram'
import { extractUniqueChords } from '../../lib/chords/parser'
import { transposeChord } from '../../lib/chords/transposer'

interface Props {
  content: string
  transposeOffset: number
}

export function ChordDiagramBar({ content, transposeOffset }: Props) {
  const chords = extractUniqueChords(content).map((c) =>
    transposeChord(c, transposeOffset),
  )

  if (chords.length === 0) return null

  return (
    <div>
      {/* Centered divider label */}
      <div className="flex items-center gap-3 mb-5">
        <div className="h-px flex-1 bg-stone-700/60" />
        <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-stone-500 select-none">
          Akordy
        </span>
        <div className="h-px flex-1 bg-stone-700/60" />
      </div>

      {/* Diagrams */}
      <div className="flex flex-wrap gap-x-5 gap-y-4">
        {chords.map((chord) => (
          <ChordDiagram key={chord} name={chord} />
        ))}
      </div>
    </div>
  )
}
