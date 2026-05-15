import type { ParsedLine } from '../../types'

const VALID_CHORD = /^[A-H][#b]?(mi|m|maj|min|aug|dim|sus|add)?[0-9]*(\/[A-H][#b]?)?$/

export function isValidChordName(name: string): boolean {
  return VALID_CHORD.test(name)
}

export function parseLine(raw: string): ParsedLine {
  const tokenRegex = /\[([^\]]+)\]/g
  let lyrics = ''
  let lastIndex = 0
  const chords: Array<{ chord: string; position: number }> = []

  let match: RegExpExecArray | null
  while ((match = tokenRegex.exec(raw)) !== null) {
    lyrics += raw.slice(lastIndex, match.index)
    if (isValidChordName(match[1])) {
      chords.push({ chord: match[1], position: lyrics.length })
    } else {
      // Section markers like [Chorus], [Verse] — keep them in the lyrics text
      lyrics += match[0]
    }
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
    if (isValidChordName(match[1])) seen.add(match[1])
  }
  return Array.from(seen)
}

const SECTION_LINE = /^\s*\[[^\]]+\]\s*$/

export function isSectionLine(text: string): boolean {
  return SECTION_LINE.test(text)
}

export function extractSectionName(text: string): string {
  const m = text.match(/\[([^\]]+)\]/)
  return m ? m[1] : text.trim()
}
