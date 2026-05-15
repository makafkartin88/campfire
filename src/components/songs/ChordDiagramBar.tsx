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
    <div className="mb-6">
      <p className="text-xs text-stone-500 uppercase tracking-wider mb-3">Akordy</p>
      <div className="flex flex-wrap gap-4">
        {chords.map((chord) => (
          <ChordDiagram key={chord} name={chord} />
        ))}
      </div>
    </div>
  )
}
