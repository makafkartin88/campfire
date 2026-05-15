import { Flame } from 'lucide-react'
import { signIn } from '../../lib/drive/auth'

interface Props {
  error?: string | null
}

export function SignInScreen({ error }: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 px-4">
      <div className="flex flex-col items-center gap-3">
        <Flame size={48} className="text-fire-500" />
        <h1 className="text-3xl font-bold text-stone-100">Campfire</h1>
        <p className="text-stone-400 text-center max-w-xs">
          Osobní zpěvník s kytarovými akordy
        </p>
      </div>

      <div className="flex flex-col items-center gap-4">
        <button
          onClick={signIn}
          className="flex items-center gap-3 px-6 py-3 bg-white text-gray-800 rounded-lg font-medium hover:bg-gray-100 transition-colors shadow-lg"
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
            <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
          Přihlásit se přes Google
        </button>

        {error && (
          <p className="text-red-400 text-sm text-center max-w-xs">{error}</p>
        )}
      </div>

      <p className="text-stone-600 text-xs text-center max-w-xs">
        Písničky jsou uloženy přímo ve tvém Google Drive ve složce "Campfire"
      </p>
    </div>
  )
}
