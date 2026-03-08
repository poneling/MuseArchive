import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
  setQueue: (tracks: Track[]) => void
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
        const idx = Math.floor(Math.random() * queue.length)
        const track = queue[idx]
        const recent = [track, ...get().recentlyPlayed.filter(t => t.id !== track.id)].slice(0, MAX_RECENT)
        set({ currentTrack: track, queueIndex: idx, isPlaying: true, progress: 0, recentlyPlayed: recent })
      },

      setVolume: (v) => set({ volume: Math.min(1, Math.max(0, v)) }),
      setProgress: (p) => set({ progress: p }),

      toggleFavorite: (trackId) => {
        const favs = get().favorites
        set({
          favorites: favs.includes(trackId)
            ? favs.filter(id => id !== trackId)
            : [...favs, trackId],
        })
      },

      isFavorite: (trackId) => get().favorites.includes(trackId),

      setQueue: (tracks) => set({ queue: tracks }),
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
