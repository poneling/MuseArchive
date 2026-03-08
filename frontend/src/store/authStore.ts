import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'

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
      },

      register: async (username, email, password) => {
        const res = await axios.post(`${API}/auth/register`, { username, email, password })
        const { token, user } = res.data
        set({ token, user, isAuthenticated: true })
      },

      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: 'musearchive-auth',
      partialize: (s) => ({ user: s.user, token: s.token, isAuthenticated: s.isAuthenticated }),
    }
  )
)
