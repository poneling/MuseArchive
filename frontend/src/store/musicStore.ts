import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authService } from '../services/api'

export interface Track {
  id: number
  title: string
  artist: string
  album: string
  albumId?: number
  artistId?: number
  duration: string
  audioUrl?: string
  genre?: string
}

// Raw API shapes (minimal, only what Home needs for cache)
export interface RawTrack {
  id: number; title: string; duration: string; audioUrl?: string; genre?: string
  album: { id: number; title: string; artist: { id: number; name: string } }
}
export interface RawAlbum {
  id: number; title: string; coverImageUrl?: string
  artist: { id: number; name: string }
}

interface MusicStore {
  // ── Player ──────────────────────────────────────────────────────────────
  currentTrack: Track | null
  queue: Track[]
  queueIndex: number
  isPlaying: boolean
  volume: number
  progress: number

  // ── Recently Played ──────────────────────────────────────────────────────
  recentlyPlayed: Track[]

  // ── Favorites ────────────────────────────────────────────────────────────
  favorites: number[]

  // ── API Cache (NOT persisted — session memory only) ───────────────────────
  cachedTracks: RawTrack[]
  cachedAlbums: RawAlbum[]
  isInitialLoaded: boolean

  // ── Actions ──────────────────────────────────────────────────────────────
  playTrack: (track: Track, queue?: Track[]) => void
  togglePlayPause: () => void
  nextTrack: () => void
  prevTrack: () => void
  shufflePlay: () => void
  setVolume: (v: number) => void
  setProgress: (p: number) => void
  toggleFavorite: (trackId: number) => void
  isFavorite: (trackId: number) => boolean
  setFavorites: (ids: number[]) => void
  setQueue: (tracks: Track[]) => void
  setCachedData: (tracks: RawTrack[], albums: RawAlbum[]) => void
  clearCache: () => void
}

const MAX_RECENT = 30

export const useMusicStore = create<MusicStore>()(
  persist(
    (set, get) => ({
      currentTrack: null,
      queue: [],
      queueIndex: 0,
      isPlaying: false,
      volume: 0.7,
      progress: 0,
      recentlyPlayed: [],
      favorites: [],
      cachedTracks: [],
      cachedAlbums: [],
      isInitialLoaded: false,

      playTrack: (track, queue) => {
        const q = queue ?? get().queue
        const idx = q.findIndex(t => t.id === track.id)
        const newIndex = idx >= 0 ? idx : 0
        const newQueue = idx >= 0 ? q : [track, ...q]

        // Add to recently played (deduplicate, max MAX_RECENT)
        const recent = [track, ...get().recentlyPlayed.filter(t => t.id !== track.id)]
          .slice(0, MAX_RECENT)

        set({
          currentTrack: track,
          queue: newQueue,
          queueIndex: newIndex,
          isPlaying: true,
          recentlyPlayed: recent,
          progress: 0,
        })
      },

      togglePlayPause: () => set(s => ({ isPlaying: !s.isPlaying })),

      nextTrack: () => {
        const { queue, queueIndex } = get()
        if (!queue.length) return
        const next = (queueIndex + 1) % queue.length
        const track = queue[next]
        const recent = [track, ...get().recentlyPlayed.filter(t => t.id !== track.id)].slice(0, MAX_RECENT)
        set({ currentTrack: track, queueIndex: next, isPlaying: true, progress: 0, recentlyPlayed: recent })
      },

      prevTrack: () => {
        const { queue, queueIndex } = get()
        if (!queue.length) return
        const prev = (queueIndex - 1 + queue.length) % queue.length
        const track = queue[prev]
        set({ currentTrack: track, queueIndex: prev, isPlaying: true, progress: 0 })
      },

      shufflePlay: () => {
        const { queue } = get()
        if (!queue.length) return
        // Fisher-Yates shuffle
        const shuffled = [...queue]
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
        }
        const track = shuffled[0]
        const recent = [track, ...get().recentlyPlayed.filter(t => t.id !== track.id)].slice(0, MAX_RECENT)
        set({ currentTrack: track, queue: shuffled, queueIndex: 0, isPlaying: true, progress: 0, recentlyPlayed: recent })
      },

      setVolume: (v) => set({ volume: Math.min(1, Math.max(0, v)) }),
      setProgress: (p) => set({ progress: p }),

      toggleFavorite: (trackId) => {
        const favs = get().favorites
        const isLiked = favs.includes(trackId)
        // Optimistic local update
        set({ favorites: isLiked ? favs.filter(id => id !== trackId) : [...favs, trackId] })
        // Sync with server if authenticated
        try {
          const raw = localStorage.getItem('musearchive-auth')
          const isAuth = raw ? JSON.parse(raw)?.state?.isAuthenticated : false
          if (isAuth) {
            if (isLiked) authService.removeFavorite(trackId).catch(() => {})
            else authService.addFavorite(trackId).catch(() => {})
          }
        } catch { /* ignore */ }
      },

      setFavorites: (ids) => set({ favorites: ids }),

      isFavorite: (trackId) => get().favorites.includes(trackId),

      setQueue: (tracks) => set({ queue: tracks }),

      setCachedData: (tracks, albums) => set({ cachedTracks: tracks, cachedAlbums: albums, isInitialLoaded: true }),

      clearCache: () => set({ cachedTracks: [], cachedAlbums: [], isInitialLoaded: false }),
    }),
    {
      name: 'musearchive-store',
      partialize: (s) => ({
        recentlyPlayed: s.recentlyPlayed,
        favorites: s.favorites,
        volume: s.volume,
      }),
    }
  )
)
