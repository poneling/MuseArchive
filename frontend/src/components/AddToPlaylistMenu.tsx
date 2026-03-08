import React, { useState, useEffect, useRef } from 'react'
import { ListPlus, Check } from 'lucide-react'
import { playlistsService } from '../services/api'
import { useAuthStore } from '../store/authStore'

interface Props {
  trackId: number
}

interface ApiPlaylist {
  id: number
  name: string
}

const AddToPlaylistMenu: React.FC<Props> = ({ trackId }) => {
  const { user, isAuthenticated } = useAuthStore()
  const [open, setOpen] = useState(false)
  const [playlists, setPlaylists] = useState<ApiPlaylist[]>([])
  const [added, setAdded] = useState<number | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && user) {
      playlistsService.getByUser(user.id)
        .then(r => setPlaylists(r.data))
        .catch(() => {})
    }
  }, [open, user])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  if (!isAuthenticated) return null

  const handleAdd = async (playlistId: number) => {
    try {
      await playlistsService.addTrack(playlistId, { trackId, addedByUserId: user!.id })
      setAdded(playlistId)
      setTimeout(() => { setAdded(null); setOpen(false) }, 800)
    } catch { /* duplicate etc. */ }
  }

  return (
    <div ref={ref} className="relative" onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setOpen(o => !o)}
        title="Çalma listesine ekle"
        className="text-zinc-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
      >
        <ListPlus className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 bottom-full mb-1 w-52 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-50 overflow-hidden">
          <p className="text-zinc-400 text-xs font-semibold px-3 py-2 border-b border-zinc-700">
            Çalma Listesine Ekle
          </p>
          {playlists.length === 0 ? (
            <p className="text-zinc-500 text-xs px-3 py-3">Henüz liste yok.</p>
          ) : (
            playlists.map(pl => (
              <button
                key={pl.id}
                onClick={() => handleAdd(pl.id)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-white hover:bg-zinc-700 transition-colors text-left"
              >
                <span className="truncate">{pl.name}</span>
                {added === pl.id && <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default AddToPlaylistMenu
