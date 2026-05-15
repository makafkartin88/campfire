import { v4 as uuidv4 } from 'uuid'
import {
  listFilesPublic,
  getFileContentPublic,
  listFiles,
  createFolder,
  createJsonFile,
  updateJsonFile,
  deleteFile,
  getFileContent,
} from './client'
import type { Song, DriveFolder } from '../../types'
import { useSongsStore } from '../../store/songs.store'
import { useFoldersStore } from '../../store/folders.store'

const PUBLIC_FOLDER_ID = import.meta.env.VITE_PUBLIC_FOLDER_ID as string

// ─── Public load (no auth required) ─────────────────────────────────────────

export async function loadPublicSongs(): Promise<void> {
  if (!PUBLIC_FOLDER_ID) return
  useSongsStore.getState().setLoading(true)

  try {
    // Load subfolders
    const { files: folderFiles } = await listFilesPublic({
      q: `'${PUBLIC_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    })
    const folders: DriveFolder[] = folderFiles.map((f) => ({
      id: f.id,
      name: f.name,
      parentId: PUBLIC_FOLDER_ID,
    }))
    useFoldersStore.getState().setFolders(folders)
    useFoldersStore.getState().setRootFolderId(PUBLIC_FOLDER_ID)

    // Load all songs from root + subfolders
    const allFolderIds = [PUBLIC_FOLDER_ID, ...folders.map((f) => f.id)]
    const songs: Song[] = []

    for (const folderId of allFolderIds) {
      const folderName = folders.find((f) => f.id === folderId)?.name ?? ''

      const { files } = await listFilesPublic({
        q: `'${folderId}' in parents and trashed=false and (mimeType='application/json' or mimeType='application/pdf')`,
      })

      for (const file of files) {
        if (file.mimeType === 'application/pdf') {
          // PDF-only song — displayed via Google Drive iframe viewer
          const title = file.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ')
          songs.push({
            id: file.id,
            title,
            artist: '',
            folder: folderName,
            key: '',
            content: '',
            pdfDriveId: file.id,
            driveFileId: file.id,
            driveParentFolderId: folderId,
            createdAt: file.modifiedTime ?? '',
            updatedAt: file.modifiedTime ?? '',
          })
        } else {
          // JSON song with chord notation
          try {
            const data = await getFileContentPublic(file.id) as Partial<Song>
            if (data.title) {
              songs.push({
                id: data.id ?? file.id,
                title: data.title,
                artist: data.artist ?? '',
                folder: data.folder ?? folderName,
                key: data.key ?? '',
                content: data.content ?? '',
                pdfDriveId: data.pdfDriveId ?? null,
                driveFileId: file.id,
                driveParentFolderId: folderId,
                createdAt: data.createdAt ?? '',
                updatedAt: data.updatedAt ?? '',
              })
            }
          } catch {
            // Skip malformed files silently
          }
        }
      }
    }

    useSongsStore.getState().setSongs(songs)
  } finally {
    useSongsStore.getState().setLoading(false)
  }
}

// ─── Authenticated sync (owner only) ────────────────────────────────────────

export async function bootstrapOwnerFolder(): Promise<string> {
  // When signed in as owner, use the same PUBLIC_FOLDER_ID for writes
  // (owner already has write access to their own folder)
  if (PUBLIC_FOLDER_ID) {
    useFoldersStore.getState().setRootFolderId(PUBLIC_FOLDER_ID)
    return PUBLIC_FOLDER_ID
  }

  // Fallback: find or create "Campfire" folder if no public folder configured
  const { files } = await listFiles({
    q: `name='Campfire' and mimeType='application/vnd.google-apps.folder' and trashed=false and 'root' in parents`,
  })
  let rootId: string
  if (files.length > 0) {
    rootId = files[0].id
  } else {
    const folder = await createFolder('Campfire', null)
    rootId = folder.id
  }
  useFoldersStore.getState().setRootFolderId(rootId)
  return rootId
}

export async function saveSong(song: Song, parentFolderId: string): Promise<Song> {
  const songData: Song = {
    ...song,
    id: song.id || uuidv4(),
    createdAt: song.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  if (song.driveFileId && !song.pdfDriveId) {
    // Update existing JSON song
    await updateJsonFile(song.driveFileId, songData)
    const updated = { ...songData, driveParentFolderId: parentFolderId }
    useSongsStore.getState().updateSong(updated)
    return updated
  } else {
    // Create new JSON song
    const file = await createJsonFile(`${songData.id}.json`, parentFolderId, songData)
    const created = { ...songData, driveFileId: file.id, driveParentFolderId: parentFolderId }
    useSongsStore.getState().addSong(created)
    return created
  }
}

export async function removeSong(song: Song): Promise<void> {
  if (song.driveFileId && !song.pdfDriveId) {
    await deleteFile(song.driveFileId)
  }
  if (song.pdfDriveId && song.pdfDriveId !== song.driveFileId) {
    await deleteFile(song.pdfDriveId).catch(() => {})
  }
  useSongsStore.getState().removeSong(song.id)
}

export async function createSongFolder(name: string, rootId: string): Promise<DriveFolder> {
  const file = await createFolder(name, rootId)
  const folder: DriveFolder = { id: file.id, name, parentId: rootId }
  useFoldersStore.getState().addFolder(folder)
  return folder
}

export { getFileContent }
