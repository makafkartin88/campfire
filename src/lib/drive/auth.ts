import { useAuthStore } from '../../store/auth.store'

/* eslint-disable @typescript-eslint/no-explicit-any */
declare let google: any
declare let gapi: any
/* eslint-enable @typescript-eslint/no-explicit-any */

export interface DriveFile {
  id: string
  name: string
  mimeType: string
  modifiedTime?: string
}

const DRIVE_DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'
const SCOPE = 'https://www.googleapis.com/auth/drive.file'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY as string

let tokenClient: { requestAccessToken: (opts: { prompt: string }) => void } | null = null
let gapiReady = false

export function isConfigured(): boolean {
  return !!(CLIENT_ID && API_KEY && CLIENT_ID !== 'undefined' && API_KEY !== 'undefined')
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }
    const s = document.createElement('script')
    s.src = src
    s.onload = () => resolve()
    s.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.head.appendChild(s)
  })
}

export async function initGapi(): Promise<void> {
  if (!isConfigured()) return
  // Load scripts dynamically so they don't block initial render
  await Promise.all([
    loadScript('https://apis.google.com/js/api.js'),
    loadScript('https://accounts.google.com/gsi/client'),
  ])
  await new Promise<void>((resolve, reject) => {
    gapi.load('client', async () => {
      try {
        await gapi.client.init({ apiKey: API_KEY, discoveryDocs: [DRIVE_DISCOVERY_DOC] })
        gapiReady = true
        resolve()
      } catch (e) {
        reject(e)
      }
    })
  })
}

export function initTokenClient(onToken: (token: string) => void): void {
  if (!isConfigured() || typeof google === 'undefined') return
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPE,
    callback: (response: { access_token: string; expires_in: string | number; error?: string }) => {
      if (response.error) {
        console.error('OAuth error:', response.error)
        return
      }
      const expiresAt = Date.now() + (Number(response.expires_in) - 60) * 1000
      useAuthStore.getState().setToken(response.access_token, expiresAt)
      onToken(response.access_token)
    },
  })
}

export function signIn(): void {
  if (!isConfigured()) {
    alert('Pro přihlášení je potřeba nastavit Google API credentials v .env.local')
    return
  }
  if (!tokenClient) return
  tokenClient.requestAccessToken({ prompt: 'consent' })
}

export function silentRefresh(): void {
  if (!tokenClient) return
  tokenClient.requestAccessToken({ prompt: '' })
}

export function signOut(): void {
  const { accessToken } = useAuthStore.getState()
  if (accessToken && typeof google !== 'undefined') {
    google.accounts.oauth2.revoke(accessToken, () => {})
  }
  useAuthStore.getState().clearToken()
}

export function isGapiReady(): boolean {
  return gapiReady
}
