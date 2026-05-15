const SHARP_SCALE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const FLAT_SCALE  = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']

const ENHARMONIC: Record<string, string> = {
  Db: 'C#', Eb: 'D#', Fb: 'E', Gb: 'F#', Ab: 'G#', Bb: 'A#', Cb: 'B',
}

const FLAT_KEYS = new Set(['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Dm', 'Gm', 'Cm', 'Fm', 'Bbm', 'Ebm'])

function normalizeRoot(root: string): string {
  return ENHARMONIC[root] ?? root
}

export function transposeChord(chord: string, semitones: number, useFlats = false): string {
  if (semitones === 0) return chord
  const match = chord.match(/^([A-G][#b]?)(.*)/)
  if (!match) return chord
  const [, rawRoot, suffix] = match
  const root = normalizeRoot(rawRoot)
  const idx = SHARP_SCALE.indexOf(root)
  if (idx === -1) return chord
  const newIdx = ((idx + semitones) % 12 + 12) % 12
  const scale = useFlats ? FLAT_SCALE : SHARP_SCALE
  return scale[newIdx] + suffix
}

export function transposeContent(content: string, semitones: number, useFlats = false): string {
  if (semitones === 0) return content
  return content.replace(/\[([^\]]+)\]/g, (_, chord) => `[${transposeChord(chord, semitones, useFlats)}]`)
}

export function shouldUseFlats(key: string): boolean {
  return FLAT_KEYS.has(key)
}
