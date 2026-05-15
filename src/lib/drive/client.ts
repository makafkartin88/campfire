import { useAuthStore } from '../../store/auth.store'
import type { Song } from '../../types'

const BASE = 'https://www.googleapis.com'
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY as string

function getToken(): string | null {
  return useAuthStore.getState().accessToken
}

export interface DriveFile {
  id: string
  name: string
  mimeType: string
  parents?: string[]
  modifiedTime?: string
}

// ─── Public read (API key only, no OAuth) ───────────────────────────────────

export async function listFilesPublic(params: {
  q: string
  fields?: string
}): Promise<{ files: DriveFile[] }> {
  const fields = params.fields ?? 'files(id,name,mimeType,parents,modifiedTime)'
  const url = new URL(`${BASE}/drive/v3/files`)
  url.searchParams.set('q', params.q)
  url.searchParams.set('fields', fields)
  url.searchParams.set('spaces', 'drive')
  url.searchParams.set('pageSize', '1000')
  url.searchParams.set('key', API_KEY)

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Drive list failed: ${res.status}`)
  return res.json()
}

export async function getFileContentPublic(fileId: string): Promise<unknown> {
  const url = `${BASE}/drive/v3/files/${fileId}?alt=media&key=${API_KEY}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Drive get failed: ${res.status}`)
  return res.json()
}

// ─── Authenticated write operations ─────────────────────────────────────────

function authHeaders(): { Authorization: string } {
  const token = getToken()
  if (!token) throw new Error('Not authenticated')
  return { Authorization: `Bearer ${token}` }
}

export async function listFiles(params: {
  q: string
  fields?: string
}): Promise<{ files: DriveFile[] }> {
  const fields = params.fields ?? 'files(id,name,mimeType,parents,modifiedTime)'
  const url = new URL(`${BASE}/drive/v3/files`)
  url.searchParams.set('q', params.q)
  url.searchParams.set('fields', fields)
  url.searchParams.set('spaces', 'drive')
  url.searchParams.set('pageSize', '1000')

  const res = await fetch(url.toString(), { headers: authHeaders() })
  if (!res.ok) throw new Error(`Drive list failed: ${res.status}`)
  return res.json()
}

export async function getFileContent(fileId: string): Promise<unknown> {
  const res = await fetch(`${BASE}/drive/v3/files/${fileId}?alt=media`, {
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error(`Drive get failed: ${res.status}`)
  return res.json()
}

export async function createJsonFile(
  name: string,
  parentId: string,
  data: unknown,
): Promise<DriveFile> {
  const boundary = `campfire_${Date.now()}`
  const metadata = JSON.stringify({ name, parents: [parentId], mimeType: 'application/json' })
  const body = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    metadata,
    `--${boundary}`,
    'Content-Type: application/json',
    '',
    JSON.stringify(data),
    `--${boundary}--`,
  ].join('\r\n')

  const res = await fetch(`${BASE}/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,parents`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': `multipart/related; boundary=${boundary}` },
    body,
  })
  if (!res.ok) throw new Error(`Drive create failed: ${res.status}`)
  return res.json()
}

export async function updateJsonFile(fileId: string, data: unknown): Promise<DriveFile> {
  const res = await fetch(`${BASE}/upload/drive/v3/files/${fileId}?uploadType=media&fields=id,name,mimeType`, {
    method: 'PATCH',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`Drive update failed: ${res.status}`)
  return res.json()
}

export async function createFolder(name: string, parentId: string | null): Promise<DriveFile> {
  const metadata: Record<string, unknown> = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
  }
  if (parentId) metadata.parents = [parentId]

  const res = await fetch(`${BASE}/drive/v3/files?fields=id,name,mimeType,parents`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(metadata),
  })
  if (!res.ok) throw new Error(`Drive createFolder failed: ${res.status}`)
  return res.json()
}

export async function deleteFile(fileId: string): Promise<void> {
  const res = await fetch(`${BASE}/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (!res.ok && res.status !== 204) throw new Error(`Drive delete failed: ${res.status}`)
}

export async function uploadPdf(
  name: string,
  parentId: string,
  arrayBuffer: ArrayBuffer,
): Promise<DriveFile> {
  const boundary = `campfire_${Date.now()}`
  const metadata = JSON.stringify({ name, parents: [parentId], mimeType: 'application/pdf' })

  const metaPart = new TextEncoder().encode(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: application/pdf\r\n\r\n`,
  )
  const endPart = new TextEncoder().encode(`\r\n--${boundary}--`)

  const combined = new Uint8Array(metaPart.length + arrayBuffer.byteLength + endPart.length)
  combined.set(metaPart, 0)
  combined.set(new Uint8Array(arrayBuffer), metaPart.length)
  combined.set(endPart, metaPart.length + arrayBuffer.byteLength)

  const res = await fetch(`${BASE}/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': `multipart/related; boundary=${boundary}` },
    body: combined,
  })
  if (!res.ok) throw new Error(`Drive uploadPdf failed: ${res.status}`)
  return res.json()
}

export async function findFileByName(
  name: string,
  parentId: string,
): Promise<DriveFile | null> {
  const { files } = await listFiles({
    q: `'${parentId}' in parents and name='${name}' and trashed=false`,
    fields: 'files(id,name,mimeType,parents)',
  })
  return files[0] ?? null
}

export async function moveSong(song: Song, newParentId: string): Promise<void> {
  if (!song.driveFileId) return
  const oldParent = song.driveParentFolderId ?? ''
  const url = new URL(`${BASE}/drive/v3/files/${song.driveFileId}`)
  url.searchParams.set('addParents', newParentId)
  url.searchParams.set('removeParents', oldParent)
  url.searchParams.set('fields', 'id,parents')
  await fetch(url.toString(), {
    method: 'PATCH',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
  })
}
