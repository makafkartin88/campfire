// Heuristic: detects chord lines and merges them with the following lyric line
// into [Chord]text notation.

const CHORD_PATTERN = /^[A-G][#b]?(m|maj|min|aug|dim|sus|add|M)?[0-9]*(\/[A-G][#b]?)?$/

function isChordToken(token: string): boolean {
  return CHORD_PATTERN.test(token)
}

function isChordLine(line: string): boolean {
  const tokens = line.trim().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return false
  const chordCount = tokens.filter(isChordToken).length
  return chordCount / tokens.length >= 0.75
}

interface ChordWithPosition {
  chord: string
  charPos: number
}

function parseChordsFromLine(line: string): ChordWithPosition[] {
  const chords: ChordWithPosition[] = []
  let i = 0
  let pos = 0

  while (i < line.length) {
    if (line[i] === ' ') {
      i++
      pos++
      continue
    }
    // Find end of token
    let end = i
    while (end < line.length && line[end] !== ' ') end++
    const token = line.slice(i, end)
    if (isChordToken(token)) {
      chords.push({ chord: token, charPos: pos })
    }
    pos += end - i
    i = end
  }
  return chords
}

function insertChordsIntoLyrics(chordsLine: string, lyricsLine: string): string {
  const chords = parseChordsFromLine(chordsLine)
  if (chords.length === 0) return lyricsLine

  // Insert [Chord] markers at the correct character positions in the lyrics
  let result = ''
  let lyricIdx = 0

  for (const { chord, charPos } of chords) {
    // Clamp position to lyrics length
    const insertAt = Math.min(charPos, lyricsLine.length)
    result += lyricsLine.slice(lyricIdx, insertAt) + `[${chord}]`
    lyricIdx = insertAt
  }
  result += lyricsLine.slice(lyricIdx)
  return result
}

export function detectChordsInText(text: string): string {
  const lines = text.split('\n')
  const output: string[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (isChordLine(line) && i + 1 < lines.length && !isChordLine(lines[i + 1])) {
      // Merge chord line with next lyric line
      const merged = insertChordsIntoLyrics(line, lines[i + 1])
      output.push(merged)
      i += 2
    } else {
      output.push(line)
      i++
    }
  }

  return output.join('\n')
}
