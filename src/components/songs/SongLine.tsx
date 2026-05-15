import type { ParsedLine } from '../../types'
import { isSectionLine, extractSectionName } from '../../lib/chords/parser'

interface Props {
  line: ParsedLine
  fontSize: number
}

export function SongLine({ line, fontSize }: Props) {
  if (line.isEmpty) {
    return <div style={{ height: `${fontSize * 0.8}px` }} />
  }

  // Section header line: [Chorus], [Verse], etc.
  if (isSectionLine(line.lyrics) && line.chords.length === 0) {
    return (
      <div
        className="mt-4 mb-2 text-xs uppercase tracking-widest text-fire-400 font-semibold"
        style={{ fontSize: fontSize * 0.75 }}
      >
        {extractSectionName(line.lyrics)}
      </div>
    )
  }

  if (line.isChordOnly) {
    return (
      <div className="chord-only-line" style={{ fontSize }}>
        {line.chords.map((c, i) => (
          <span key={i} className="chord-badge" style={{ left: `${c.position}ch`, top: 0 }}>
            {c.chord}
          </span>
        ))}
        <span style={{ visibility: 'hidden' }}>{'‎'}</span>
      </div>
    )
  }

  if (line.chords.length === 0) {
    return (
      <div className="text-stone-200 whitespace-pre-wrap" style={{ fontSize, lineHeight: 1.7 }}>
        {line.lyrics}
      </div>
    )
  }

  // Inline chords above lyrics — use inline-flex column per chord segment
  const segments: Array<{ text: string; chord?: string }> = []
  let last = 0

  for (const { chord, position } of line.chords) {
    segments.push({ text: line.lyrics.slice(last, position), chord })
    last = position
  }
  segments.push({ text: line.lyrics.slice(last) })

  return (
    <div
      className="chord-mixed-line text-stone-200"
      style={{ fontSize, lineHeight: 1.5 }}
    >
      {segments.map((seg, i) => (
        <span
          key={i}
          style={{
            display: 'inline-flex',
            flexDirection: 'column',
            verticalAlign: 'top',
            whiteSpace: 'pre',
          }}
        >
          <span
            className="text-fire-400 font-mono font-bold"
            style={{ fontSize: fontSize * 0.78, lineHeight: 1.2, minHeight: '1.2em' }}
          >
            {seg.chord ?? ' '}
          </span>
          <span style={{ lineHeight: 1.4 }}>{seg.text}</span>
        </span>
      ))}
    </div>
  )
}
