import type { ParsedLine } from '../../types'

export function parseLine(raw: string): ParsedLine {
  const chordRegex = /\[([^\]]+)\]/g
  let lyrics = ''
  let lastIndex = 0
  const chords: Array<{ chord: string; position: number }> = []

  let match: RegExpExecArray | null
  while ((match = chordRegex.exec(raw)) !== null) {
    lyrics += raw.slice(lastIndex, match.index)
    chords.push({ chord: match[1], position: lyrics.length })
    lastIndex = match.index + match[0].length
  }
  lyrics += raw.slice(lastIndex)

  return {
    lyrics,
    chords,
    isChordOnly: lyrics.trim() === '' && chords.length > 0,
    isEmpty: lyrics.trim() === '' && chords.length === 0,
  }
}

export function parseSong(content: string): ParsedLine[] {
  return content.split('\n').map(parseLine)
}

export function extractUniqueChords(content: string): string[] {
  const regex = /\[([^\]]+)\]/g
  const seen = new Set<string>()
  let match: RegExpExecArray | null
  while ((match = regex.exec(content)) !== null) {
    seen.add(match[1])
  }
  return Array.from(seen)
}
