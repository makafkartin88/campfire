import { useEffect, useRef } from 'react'
import { initGapi, initTokenClient, silentRefresh, onGapiReady } from '../lib/drive/auth'
import { loadPublicSongs, loadOwnerSongs, bootstrapOwnerFolder } from '../lib/drive/sync'
import { useAuthStore } from '../store/auth.store'

export function useDrive() {
  const { isSignedIn, isTokenValid, clearToken, setGapiReady, setAuthError } = useAuthStore()
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    // Always load public songs first (no auth needed)
    loadPublicSongs().catch(console.error)

    // Initialize Google auth in background (for owner edit mode)
    initGapi()
      .then(() => {
        onGapiReady(() => setGapiReady(true))
        initTokenClient(
          async () => {
            // Called after successful owner sign-in — use authenticated API
            try {
              await bootstrapOwnerFolder()
              await loadOwnerSongs()
            } catch (e) {
              console.error('Owner sync failed:', e)
              setAuthError(e instanceof Error ? e.message : 'Chyba při načítání')
            }
          },
          (err) => setAuthError(`Přihlášení selhalo: ${err}`),
        )
        // Attempt silent token refresh if user was previously signed in
        if (isSignedIn) silentRefresh()
      })
      .catch(console.error) // Non-fatal: gapi might not be configured yet
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function syncAll() {
    if (!isTokenValid()) return
    try {
      await bootstrapOwnerFolder()
      await loadOwnerSongs()
    } catch (e) {
      const msg = e instanceof Error ? e.message : ''
      if (msg.includes('401') || msg.includes('403')) clearToken()
    }
  }

  return { syncAll }
}
