import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  isSignedIn: boolean
  accessToken: string | null
  tokenExpiresAt: number | null
  setToken: (token: string, expiresAt: number) => void
  clearToken: () => void
  isTokenValid: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isSignedIn: false,
      accessToken: null,
      tokenExpiresAt: null,
      setToken: (token, expiresAt) =>
        set({ isSignedIn: true, accessToken: token, tokenExpiresAt: expiresAt }),
      clearToken: () =>
        set({ isSignedIn: false, accessToken: null, tokenExpiresAt: null }),
      isTokenValid: () => {
        const { accessToken, tokenExpiresAt } = get()
        return !!accessToken && !!tokenExpiresAt && Date.now() < tokenExpiresAt
      },
    }),
    {
      name: 'campfire-auth',
      // Only persist signed-in status, not the token itself (security)
      partialize: (state) => ({ isSignedIn: state.isSignedIn }),
    },
  ),
)
