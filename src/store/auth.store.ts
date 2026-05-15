import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  isSignedIn: boolean
  accessToken: string | null
  tokenExpiresAt: number | null
  gapiReady: boolean
  authPending: boolean
  authError: string | null
  setToken: (token: string, expiresAt: number) => void
  clearToken: () => void
  isTokenValid: () => boolean
  setGapiReady: (ready: boolean) => void
  setAuthPending: (pending: boolean) => void
  setAuthError: (err: string | null) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isSignedIn: false,
      accessToken: null,
      tokenExpiresAt: null,
      gapiReady: false,
      authPending: false,
      authError: null,
      setToken: (token, expiresAt) =>
        set({ isSignedIn: true, accessToken: token, tokenExpiresAt: expiresAt, authPending: false, authError: null }),
      clearToken: () =>
        set({ isSignedIn: false, accessToken: null, tokenExpiresAt: null }),
      isTokenValid: () => {
        const { accessToken, tokenExpiresAt } = get()
        return !!accessToken && !!tokenExpiresAt && Date.now() < tokenExpiresAt
      },
      setGapiReady: (ready) => set({ gapiReady: ready }),
      setAuthPending: (pending) => set({ authPending: pending }),
      setAuthError: (err) => set({ authError: err, authPending: false }),
    }),
    {
      name: 'campfire-auth',
      // Only persist signed-in status, not the token itself (security)
      partialize: (state) => ({ isSignedIn: state.isSignedIn }),
    },
  ),
)
