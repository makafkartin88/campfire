import type { ParsedLine } from '../../types'

interface Props {
  line: ParsedLine
  fontSize: number
}

export function SongLine({ line, fontSize }: Props) {
  if (line.isEmpty) {
    return <div style={{ height: `${fontSize * 0.8}px` }} />
  }

  if (line.isChordOnly) {
    return (
      <div className="chord-line" style={{ fontSize }}>
        {line.chords.map((c, i) => (
          <span key={i} className="chord-badge" style={{ left: `${c.position}ch` }}>
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

  // Render lyrics with inline chords above them
  // Split lyrics at chord positions and interleave chord badges
  const segments: Array<{ text: string; chord?: string }> = []
  let last = 0

  for (const { chord, position } of line.chords) {
    segments.push({ text: line.lyrics.slice(last, position), chord })
    last = position
  }
  segments.push({ text: line.lyrics.slice(last) })

  return (
    <div className="chord-line" style={{ fontSize }}>
      {segments.map((seg, i) => (
        <span key={i} style={{ position: 'relative', display: 'inline' }}>
          {seg.chord && (
            <span className="chord-badge" style={{ left: 0 }}>
              {seg.chord}
            </span>
          )}
          {seg.text}
        </span>
      ))}
    </div>
  )
}
