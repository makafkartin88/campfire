// Converts "chord-above-lyric" format to "[Chord]text" inline format.
//
// Input:
//   Em      D     Am  Em
//   Zas mě tu máš, nějak se mračíš
//
// Output:
//   [Em]Zas mě [D]tu máš, [Am]nějak se [Em]mračíš

const CHORD_REGEX = /^[A-H][#b]?(mi|m|maj|min|aug|dim|sus|add)?[0-9]*(\/[A-H][#b]?)?$/

function normalizeChord(raw: string): string {
  // Czech "Emi" → "Em", "Ami" → "Am" etc.
  return raw.replace(/^([A-H][#b]?)mi$/, '$1m')
}

export function isChordLine(line: string): boolean {
  const tokens = line.trim().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return false
  const chordCount = tokens.filter((t) => CHORD_REGEX.test(t)).length
  return chordCount / tokens.length >= 0.7
}

function chordsAt(chordLine: string): Array<{ chord: string; position: number }> {
  const result: Array<{ chord: string; position: number }> = []
  let i = 0
  while (i < chordLine.length) {
    if (chordLine[i] === ' ' || chordLine[i] === '\t') {
      i++
      continue
    }
    const start = i
    while (i < chordLine.length && chordLine[i] !== ' ' && chordLine[i] !== '\t') i++
    result.push({ chord: normalizeChord(chordLine.slice(start, i)), position: start })
  }
  return result
}

function mergeChordLineIntoLyrics(chordLine: string, lyricLine: string): string {
  const chords = chordsAt(chordLine)
  if (chords.length === 0) return lyricLine

  let result = ''
  let lastPos = 0
  for (const { chord, position } of chords) {
    const pos = Math.min(position, lyricLine.length)
    result += lyricLine.slice(lastPos, pos) + `[${chord}]`
    lastPos = pos
  }
  result += lyricLine.slice(lastPos)
  return result
}

export function convertToInline(raw: string): string {
  const lines = raw.split('\n')
  const output: string[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    const next = i + 1 < lines.length ? lines[i + 1] : null
    if (isChordLine(line) && next !== null && next.trim() !== '' && !isChordLine(next)) {
      output.push(mergeChordLineIntoLyrics(line, next))
      i += 2
    } else {
      output.push(line)
      i++
    }
  }
  return output.join('\n')
}

export function looksLikeInlineFormat(raw: string): boolean {
  return /\[[A-H][#b]?[a-z0-9]*\]/.test(raw)
}
