export interface Song {
  id: string
  title: string
  artist: string
  folderId: string | null
  key: string
  content: string
}

export interface Folder {
  id: string
  name: string
}

export interface ParsedLine {
  lyrics: string
  chords: Array<{ chord: string; position: number }>
  isChordOnly: boolean
  isEmpty: boolean
}

export interface ChordPosition {
  frets: number[]
  fingers: number[]
  barres: Array<{ fret: number; fromString: number; toString: number }>
  baseFret: number
  capo?: boolean
}
