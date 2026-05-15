import { useEffect, useRef } from 'react'
import { initGapi, initTokenClient, silentRefresh } from '../lib/drive/auth'
import { loadPublicSongs, bootstrapOwnerFolder } from '../lib/drive/sync'
import { useAuthStore } from '../store/auth.store'

export function useDrive() {
  const { isSignedIn, isTokenValid, clearToken } = useAuthStore()
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    // Always load public songs first (no auth needed)
    loadPublicSongs().catch(console.error)

    // Initialize Google auth in background (for owner edit mode)
    initGapi()
      .then(() => {
        initTokenClient(async () => {
          // Called after successful owner sign-in
          try {
            await bootstrapOwnerFolder()
            await loadPublicSongs() // Refresh to get latest including newly added
          } catch (e) {
            console.error('Owner sync failed:', e)
          }
        })
        // Attempt silent token refresh if user was previously signed in
        if (isSignedIn) silentRefresh()
      })
      .catch(console.error) // Non-fatal: gapi might not be configured yet
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function syncAll() {
    if (!isTokenValid()) return
    try {
      await bootstrapOwnerFolder()
      await loadPublicSongs()
    } catch (e) {
      const msg = e instanceof Error ? e.message : ''
      if (msg.includes('401') || msg.includes('403')) clearToken()
    }
  }

  return { syncAll }
}
