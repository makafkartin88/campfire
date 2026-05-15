import type { ChordPosition } from '../../types'

// @tombatossals/chords-db structure
interface ChordsDb {
  chords: Record<string, Array<{ suffix: string; positions: ChordPosition[] }>>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: ChordsDb | null = null

async function getDb(): Promise<ChordsDb> {
  if (db) return db
  const mod = await import('@tombatossals/chords-db/lib/guitar.json')
  db = mod.default as unknown as ChordsDb
  return db
}

const SUFFIX_ALIASES: Record<string, string> = {
  '': 'major',
  M: 'major',
  maj: 'major',
  m: 'minor',
  min: 'minor',
  mi: 'minor',
}

// Czech "H" = English "B", Czech "B" = English "Bb"
const KEY_ALIASES: Record<string, string> = {
  H: 'B',
}

function parseChordName(name: string): { key: string; suffix: string } {
  const match = name.match(/^([A-H][#b]?)(.*)/)
  if (!match) return { key: name, suffix: 'major' }
  const [, rawKey, rawSuffix] = match
  const key = KEY_ALIASES[rawKey] ?? rawKey
  const suffix = SUFFIX_ALIASES[rawSuffix] ?? (rawSuffix || 'major')
  return { key, suffix }
}

export async function getChordPositions(chordName: string): Promise<ChordPosition[]> {
  const guitar = await getDb()
  // Handle slash chords: "G/B" → try "G"
  const baseName = chordName.includes('/') ? chordName.split('/')[0] : chordName
  const { key, suffix } = parseChordName(baseName)

  const keyChords = guitar.chords[key]
  if (!keyChords) return []

  const entry = keyChords.find((c) => c.suffix === suffix)
  return (entry?.positions) ?? []
}

export async function getFirstPosition(chordName: string): Promise<ChordPosition | null> {
  const positions = await getChordPositions(chordName)
  return positions[0] ?? null
}
