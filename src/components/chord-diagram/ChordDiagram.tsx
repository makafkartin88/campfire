import { useEffect, useState } from 'react'
import type { ChordPosition } from '../../types'
import { getFirstPosition } from '../../lib/chords/diagram'

interface Props {
  name: string
}

const W = 70
const H = 90
const STRING_COUNT = 6
const FRET_COUNT = 4
const LEFT = 14
const TOP = 22
const STRING_GAP = (W - LEFT - 6) / (STRING_COUNT - 1)
const FRET_GAP = (H - TOP - 12) / FRET_COUNT
const DOT_R = 5
const NUT_H = 4

function DiagramSvg({ name, pos }: { name: string; pos: ChordPosition }) {
  const { frets, fingers, barres, baseFret } = pos
  const showNut = baseFret === 1

  const sx = (stringIdx: number) => LEFT + (STRING_COUNT - 1 - stringIdx) * STRING_GAP
  const fy = (fret: number) => TOP + (fret - 0.5) * FRET_GAP

  return (
    <svg width={W} height={H + 14} viewBox={`0 0 ${W} ${H + 14}`} className="flex-shrink-0">
      {/* Chord name */}
      <text x={W / 2} y={11} textAnchor="middle" fontSize={9} fontWeight="600" fill="#fb923c" fontFamily="monospace">
        {name}
      </text>

      {/* Strings (vertical lines) */}
      {Array.from({ length: STRING_COUNT }, (_, i) => (
        <line key={i} x1={sx(i)} y1={TOP} x2={sx(i)} y2={TOP + FRET_COUNT * FRET_GAP} stroke="#78716c" strokeWidth={1} />
      ))}

      {/* Frets (horizontal lines) */}
      {Array.from({ length: FRET_COUNT + 1 }, (_, i) => (
        <line key={i} x1={LEFT} y1={TOP + i * FRET_GAP} x2={W - 6} y2={TOP + i * FRET_GAP} stroke="#78716c" strokeWidth={i === 0 && showNut ? NUT_H : 1} />
      ))}

      {/* Base fret label */}
      {baseFret > 1 && (
        <text x={LEFT - 4} y={TOP + FRET_GAP * 0.6} textAnchor="end" fontSize={7} fill="#a8a29e">
          {baseFret}fr
        </text>
      )}

      {/* Barres */}
      {barres.map((b, i) => {
        const x1 = sx(b.toString - 1)
        const x2 = sx(b.fromString - 1)
        const y = fy(b.fret)
        return (
          <rect
            key={i}
            x={Math.min(x1, x2)}
            y={y - DOT_R}
            width={Math.abs(x2 - x1) + 2}
            height={DOT_R * 2}
            rx={DOT_R}
            fill="#fb923c"
          />
        )
      })}

      {/* Finger dots */}
      {frets.map((fret, i) => {
        if (fret <= 0) return null
        const isBarred = barres.some(
          (b) => b.fret === fret && i + 1 >= b.fromString && i + 1 <= b.toString,
        )
        if (isBarred) return null
        return (
          <circle key={i} cx={sx(i)} cy={fy(fret)} r={DOT_R} fill="#fb923c" />
        )
      })}

      {/* Open / muted strings */}
      {frets.map((fret, i) => {
        if (fret === 0) {
          return (
            <circle key={i} cx={sx(i)} cy={TOP - 7} r={3.5} fill="none" stroke="#78716c" strokeWidth={1.2} />
          )
        }
        if (fret === -1) {
          const cx = sx(i)
          const cy = TOP - 7
          const d = 3
          return (
            <g key={i}>
              <line x1={cx - d} y1={cy - d} x2={cx + d} y2={cy + d} stroke="#78716c" strokeWidth={1.5} />
              <line x1={cx + d} y1={cy - d} x2={cx - d} y2={cy + d} stroke="#78716c" strokeWidth={1.5} />
            </g>
          )
        }
        return null
      })}

      {/* Finger numbers */}
      {fingers.map((finger, i) => {
        if (finger === 0 || frets[i] <= 0) return null
        return (
          <text key={i} x={sx(i)} y={fy(frets[i]) + 3.5} textAnchor="middle" fontSize={6} fill="#1c1917" fontWeight="700">
            {finger}
          </text>
        )
      })}
    </svg>
  )
}

export function ChordDiagram({ name }: Props) {
  const [pos, setPos] = useState<ChordPosition | null>(null)

  useEffect(() => {
    getFirstPosition(name).then(setPos)
  }, [name])

  if (!pos) {
    return (
      <div className="flex flex-col items-center gap-1 w-[70px]">
        <div className="text-fire-400 font-mono text-xs font-bold">{name}</div>
        <div className="w-[60px] h-[80px] border border-stone-700 rounded flex items-center justify-center text-stone-500 text-xs">?</div>
      </div>
    )
  }

  return <DiagramSvg name={name} pos={pos} />
}
