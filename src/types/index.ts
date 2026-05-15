export interface Song {
  id: string
  title: string
  artist: string
  folder: string
  key: string
  content: string
  pdfDriveId: string | null
  driveFileId: string | null
  driveParentFolderId: string | null
  createdAt: string
  updatedAt: string
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

export interface DriveFolder {
  id: string
  name: string
  parentId: string | null
}
