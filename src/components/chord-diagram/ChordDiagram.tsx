import { useEffect, useState } from 'react'
import type { ChordPosition } from '../../types'
import { getFirstPosition } from '../../lib/chords/diagram'

interface Props {
  name: string
}

const W = 70
const H = 90
const SCALE = 1.45          // render diagrams ~45 % larger
const SVG_W = W * SCALE
const SVG_H = (H + 14) * SCALE
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
    <svg width={SVG_W} height={SVG_H} viewBox={`0 0 ${W} ${H + 14}`} className="flex-shrink-0">
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

function FallbackSvg({ name }: { name: string }) {
  return (
    <svg width={SVG_W} height={SVG_H} viewBox={`0 0 ${W} ${H + 14}`} className="flex-shrink-0">
      <text x={W / 2} y={11} textAnchor="middle" fontSize={9} fontWeight="600" fill="#fb923c" fontFamily="monospace">
        {name}
      </text>
      {/* Empty fretboard outline */}
      {Array.from({ length: STRING_COUNT }, (_, i) => (
        <line key={`s${i}`} x1={LEFT + i * STRING_GAP} y1={TOP} x2={LEFT + i * STRING_GAP} y2={TOP + FRET_COUNT * FRET_GAP} stroke="#44403c" strokeWidth={1} />
      ))}
      {Array.from({ length: FRET_COUNT + 1 }, (_, i) => (
        <line key={`f${i}`} x1={LEFT} y1={TOP + i * FRET_GAP} x2={W - 6} y2={TOP + i * FRET_GAP} stroke="#44403c" strokeWidth={i === 0 ? NUT_H : 1} />
      ))}
      <text x={W / 2} y={TOP + (FRET_COUNT * FRET_GAP) / 2 + 5} textAnchor="middle" fontSize={14} fill="#57534e">?</text>
    </svg>
  )
}

export function ChordDiagram({ name }: Props) {
  const [pos, setPos] = useState<ChordPosition | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let active = true
    getFirstPosition(name).then((p) => {
      if (!active) return
      setPos(p)
      setLoaded(true)
    })
    return () => {
      active = false
    }
  }, [name])

  if (!loaded) {
    return <div style={{ width: SVG_W, height: SVG_H }} className="flex-shrink-0" />
  }

  if (!pos) return <FallbackSvg name={name} />

  return <DiagramSvg name={name} pos={pos} />
}
