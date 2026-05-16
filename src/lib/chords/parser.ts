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

// Czech and generic section prefixes that may appear inline before chord+lyric content.
// e.g. "R: [G]Jožin z bažin..." → synthetic [Refrén] header + parsed lyric line
const INLINE_SECTION_PREFIX =
  /^((?:Ref(?:rén)?|R)\s*\.?:?|(?:\d+\.\s*)?(?:sloka|verse|chorus|bridge|intro|outro|mezihra|c-část|b-část))\s*:?\s+/i

const SECTION_PREFIX_LABEL: Record<string, string> = {
  r: 'Refrén',
  ref: 'Refrén',
  refrén: 'Refrén',
  refren: 'Refrén',
  chorus: 'Chorus',
  verse: 'Verse',
  bridge: 'Bridge',
  intro: 'Intro',
  outro: 'Outro',
  mezihra: 'Mezihra',
}

function normalizeLabel(raw: string): string {
  const key = raw
    .toLowerCase()
    .replace(/[.:0-9\s]/g, '')
    .trim()
  return SECTION_PREFIX_LABEL[key] ?? raw.replace(/[:.]\s*$/, '').trim()
}

export function parseSong(content: string): ParsedLine[] {
  const result: ParsedLine[] = []

  for (const rawLine of content.split('\n')) {
    const m = rawLine.match(INLINE_SECTION_PREFIX)
    if (m) {
      const remainder = rawLine.slice(m[0].length)
      // Only split when there's actual content after the prefix (not just whitespace/chords-only blank)
      if (remainder.trim()) {
        const label = normalizeLabel(m[1])
        // Synthetic section-header line (isSectionLine recognises [X] pattern)
        result.push({ lyrics: `[${label}]`, chords: [], isChordOnly: false, isEmpty: false })
        result.push(parseLine(remainder))
        continue
      }
    }
    result.push(parseLine(rawLine))
  }

  return result
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
