import React, { useState } from 'react'
import { X, Music, Loader2 } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

interface LoginModalProps {
  onClose: () => void
}

const LoginModal: React.FC<LoginModalProps> = ({ onClose }) => {
  const [mode, setMode]         = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const { login, register } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(username, password)
      } else {
        await register(username, email, password)
      }
      onClose()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 bg-zinc-900 rounded-2xl p-8 w-full max-w-sm shadow-2xl border border-zinc-800">
        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>

        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <Music className="w-10 h-10 text-green-500 mb-2" />
          <h2 className="text-xl font-bold text-white">
            {mode === 'login' ? 'Log in to MuseArchive' : 'Create an account'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-1 font-medium uppercase tracking-wide">
              {mode === 'login' ? 'Username or email' : 'Username'}
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-green-500 transition-colors"
              placeholder={mode === 'login' ? 'Enter username or email' : 'Choose a username'}
            />
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-xs text-zinc-400 mb-1 font-medium uppercase tracking-wide">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-green-500 transition-colors"
                placeholder="your@email.com"
              />
            </div>
          )}

          <div>
            <label className="block text-xs text-zinc-400 mb-1 font-medium uppercase tracking-wide">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-green-500 transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-900/20 rounded-lg px-3 py-2 border border-red-800/40">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-400 text-black font-bold py-3 rounded-full transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === 'login' ? 'Log In' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-5 text-center">
          <p className="text-zinc-400 text-sm">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null) }}
              className="text-white font-semibold hover:underline"
            >
              {mode === 'login' ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginModal
