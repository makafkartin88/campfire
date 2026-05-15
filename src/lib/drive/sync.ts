import { v4 as uuidv4 } from 'uuid'
import {
  getFileContentPublic,
  listFiles,
  getFileContent,
  createJsonFile,
  updateJsonFile,
  findFileByName,
  setFilePublicReader,
} from './client'
import type { Song, DriveFolder } from '../../types'
import { useSongsStore } from '../../store/songs.store'
import { useFoldersStore } from '../../store/folders.store'

const PUBLIC_FOLDER_ID = import.meta.env.VITE_PUBLIC_FOLDER_ID as string
const INDEX_FILENAME = '_index.json'
const INDEX_STORAGE_KEY = 'campfire-index-file-id'

// ─── Types ───────────────────────────────────────────────────────────────────

interface IndexFolder {
  id: string
  name: string
}

interface IndexSong {
  id: string
  title: string
  artist: string
  folderId: string | null
  key: string
  content: string
  pdfDriveId: string | null
  createdAt: string
  updatedAt: string
}

interface SongbookIndex {
  version: 1
  updatedAt: string
  folders: IndexFolder[]
  songs: IndexSong[]
}

// ─── Index file ID cache ──────────────────────────────────────────────────────

let _indexFileId: string | null = (import.meta.env.VITE_INDEX_FILE_ID as string) || null

function getIndexFileId(): string | null {
  return _indexFileId ?? localStorage.getItem(INDEX_STORAGE_KEY)
}

function setIndexFileId(id: string): void {
  _indexFileId = id
  localStorage.setItem(INDEX_STORAGE_KEY, id)
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function emptyIndex(): SongbookIndex {
  return { version: 1, updatedAt: new Date().toISOString(), folders: [], songs: [] }
}

async function readIndex(): Promise<SongbookIndex> {
  const id = getIndexFileId()
  if (!id) throw new Error('Index file ID not set')
  return (await getFileContent(id)) as SongbookIndex
}

async function writeIndex(idx: SongbookIndex): Promise<void> {
  const id = getIndexFileId()
  if (!id) throw new Error('Index file ID not set')
  idx.updatedAt = new Date().toISOString()
  await updateJsonFile(id, idx)
}

function applyIndex(idx: SongbookIndex): void {
  const folders: DriveFolder[] = idx.folders.map((f) => ({
    id: f.id,
    name: f.name,
    parentId: null,
  }))
  useFoldersStore.getState().setFolders(folders)
  useFoldersStore.getState().setRootFolderId(PUBLIC_FOLDER_ID)

  const songs: Song[] = idx.songs.map((s) => indexSongToSong(s, idx.folders))
  useSongsStore.getState().setSongs(songs)
}

function indexSongToSong(s: IndexSong, folders: IndexFolder[]): Song {
  const folderName = folders.find((f) => f.id === s.folderId)?.name ?? ''
  return {
    id: s.id,
    title: s.title,
    artist: s.artist,
    folder: folderName,
    key: s.key,
    content: s.content,
    pdfDriveId: s.pdfDriveId,
    driveFileId: null,
    driveParentFolderId: s.folderId,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  }
}

function songToIndexSong(song: Song, folderId: string | null): IndexSong {
  return {
    id: song.id || uuidv4(),
    title: song.title,
    artist: song.artist,
    folderId,
    key: song.key,
    content: song.content,
    pdfDriveId: song.pdfDriveId,
    createdAt: song.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

// ─── Public load (no auth, 1 API call) ───────────────────────────────────────

export async function loadPublicSongs(): Promise<void> {
  const id = getIndexFileId()
  if (!id) {
    useSongsStore.getState().setSongs([])
    useSongsStore.getState().setLoading(false)
    return
  }
  const store = useSongsStore.getState()
  store.setLoading(true)
  store.setLoadingStatus('Načítám zpěvník…')
  try {
    const idx = (await getFileContentPublic(id)) as SongbookIndex
    applyIndex(idx)
    store.setLoadingStatus('')
  } catch {
    store.setSongs([])
    store.setLoadingStatus('')
  } finally {
    store.setLoading(false)
  }
}

// ─── Bootstrap index file (owner only) ───────────────────────────────────────

export async function bootstrapIndex(): Promise<string> {
  const existing = await findFileByName(INDEX_FILENAME, PUBLIC_FOLDER_ID)
  if (existing) {
    setIndexFileId(existing.id)
    await setFilePublicReader(existing.id).catch(() => {})
    return existing.id
  }
  const file = await createJsonFile(INDEX_FILENAME, PUBLIC_FOLDER_ID, emptyIndex())
  setIndexFileId(file.id)
  await setFilePublicReader(file.id)
  return file.id
}

// ─── Migrate existing PDFs (runs once when index is empty) ───────────────────

async function migrateExistingPdfs(idx: SongbookIndex): Promise<SongbookIndex> {
  // List subfolders first
  const { files: subfolders } = await listFiles({
    q: `'${PUBLIC_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
  })

  // Ensure index folders exist for each Drive subfolder
  for (const sf of subfolders) {
    if (!idx.folders.find((f) => f.name === sf.name)) {
      idx.folders.push({ id: uuidv4(), name: sf.name })
    }
  }

  // Scan only subfolders for PDFs (root folder files are ignored)
  const foldersToScan = subfolders.map((sf) => ({
    driveId: sf.id,
    indexFolderId: idx.folders.find((f) => f.name === sf.name)?.id ?? null,
  }))

  for (const { driveId, indexFolderId } of foldersToScan) {
    const { files } = await listFiles({
      q: `'${driveId}' in parents and mimeType='application/pdf' and trashed=false`,
    })
    for (const file of files) {
      const title = file.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ')
      idx.songs.push({
        id: uuidv4(),
        title,
        artist: '',
        folderId: indexFolderId,
        key: '',
        content: '',
        pdfDriveId: file.id,
        createdAt: file.modifiedTime ?? new Date().toISOString(),
        updatedAt: file.modifiedTime ?? new Date().toISOString(),
      })
    }
  }

  return idx
}

// ─── Owner load (authenticated) ──────────────────────────────────────────────

export async function loadOwnerSongs(): Promise<void> {
  const store = useSongsStore.getState()
  store.setLoading(true)
  try {
    store.setLoadingStatus('Připravuji Drive…')
    await bootstrapIndex()

    store.setLoadingStatus('Načítám písničky…')
    let idx = await readIndex()

    if (idx.songs.length === 0) {
      store.setLoadingStatus('Migrace PDF souborů…')
      idx = await migrateExistingPdfs(idx)
      if (idx.songs.length > 0) await writeIndex(idx)
    }

    applyIndex(idx)
    store.setLoadingStatus('')
  } finally {
    store.setLoading(false)
  }
}

// ─── bootstrapOwnerFolder — kept for API compatibility ───────────────────────

export async function bootstrapOwnerFolder(): Promise<string> {
  await bootstrapIndex()
  useFoldersStore.getState().setRootFolderId(PUBLIC_FOLDER_ID)
  return PUBLIC_FOLDER_ID
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function saveSong(song: Song, folderId: string | null): Promise<Song> {
  useSongsStore.getState().setLoadingStatus('Ukládám…')
  const idx = await readIndex()
  const indexSong = songToIndexSong(song, folderId)
  const pos = idx.songs.findIndex((s) => s.id === indexSong.id)
  if (pos >= 0) {
    idx.songs[pos] = indexSong
  } else {
    idx.songs.push(indexSong)
  }
  await writeIndex(idx)
  useSongsStore.getState().setLoadingStatus('')

  const result = indexSongToSong(indexSong, idx.folders)
  if (pos >= 0) {
    useSongsStore.getState().updateSong(result)
  } else {
    useSongsStore.getState().addSong(result)
  }
  return result
}

export async function removeSong(song: Song): Promise<void> {
  const idx = await readIndex()
  idx.songs = idx.songs.filter((s) => s.id !== song.id)
  await writeIndex(idx)
  useSongsStore.getState().removeSong(song.id)
}

export async function createSongFolder(name: string): Promise<DriveFolder> {
  const idx = await readIndex()
  const newFolder: IndexFolder = { id: uuidv4(), name }
  idx.folders.push(newFolder)
  await writeIndex(idx)
  const driveFolder: DriveFolder = { id: newFolder.id, name, parentId: null }
  useFoldersStore.getState().addFolder(driveFolder)
  return driveFolder
}

export { getFileContent }
