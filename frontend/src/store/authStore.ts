import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'
import { useMusicStore } from './musicStore'
import { authService } from '../services/api'

export interface AuthUser {
  id: number
  username: string
  email: string
  firstName?: string
  lastName?: string
  profileImageUrl?: string
}

interface AuthStore {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean

  login: (usernameOrEmail: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const API = 'http://localhost:5222/api'

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (usernameOrEmail, password) => {
        const res = await axios.post(`${API}/auth/login`, { usernameOrEmail, password })
        const { token, user } = res.data
        set({ token, user, isAuthenticated: true })
        // Load server-side favorites — persist has written token to localStorage by now
        try {
          const favsRes = await authService.getFavorites()
          const ids: number[] = (favsRes.data as any[]).map((f: any) => f.trackId ?? f.id)
          useMusicStore.getState().setFavorites(ids)
        } catch { /* ignore */ }
      },

      register: async (username, email, password) => {
        const res = await axios.post(`${API}/auth/register`, { username, email, password })
        const { token, user } = res.data
        set({ token, user, isAuthenticated: true })
        // New account has no favorites yet — reset to empty
        useMusicStore.getState().setFavorites([])
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false })
        useMusicStore.getState().setFavorites([])
      },
    }),
    {
      name: 'musearchive-auth',
      partialize: (s) => ({ user: s.user, token: s.token, isAuthenticated: s.isAuthenticated }),
    }
  )
)
