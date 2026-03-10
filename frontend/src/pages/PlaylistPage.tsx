import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Play, Music, Trash2, Pencil, Check, X, Heart } from 'lucide-react'
import { playlistsService } from '../services/api'
import { useMusicStore, Track } from '../store/musicStore'
import { useAuthStore } from '../store/authStore'

interface ApiTrack {
  id: number
  title: string
  duration: string
  audioUrl?: string
  genre?: string
  album: { id: number; title: string; artist: { id: number; name: string } }
}

interface ApiPlaylist {
  id: number
  name: string
  description?: string
  createdByUserId: number
  playlistTracks: { position: number; track: ApiTrack }[]
}

const formatTime = (ts: string | undefined) => {
  if (!ts) return ''
  const parts = ts.split(':')
  if (parts.length < 2) return ts
  const m = parseInt(parts[1])
  const s = Math.floor(parseFloat(parts[2] ?? '0'))
  return `${m}:${String(s).padStart(2, '0')}`
}

const mapTrack = (t: ApiTrack): Track => ({
  id: t.id,
  title: t.title,
  artist: t.album?.artist?.name ?? 'Unknown Artist',
  artistId: t.album?.artist?.id,
  album: t.album?.title ?? 'Unknown Album',
  albumId: t.album?.id,
  duration: t.duration ?? '',
  audioUrl: t.audioUrl,
  genre: t.genre,
})

const PlaylistPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const playlistId = parseInt(id ?? '0')
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { playTrack, currentTrack, isPlaying, toggleFavorite, isFavorite } = useMusicStore()

  const [playlist, setPlaylist] = useState<ApiPlaylist | null>(null)
  const [loading, setLoading] = useState(true)
  const [renaming, setRenaming] = useState(false)
  const [newName, setNewName] = useState('')

  useEffect(() => {
    if (!playlistId) return
    setLoading(true)
    playlistsService.getById(playlistId)
      .then(r => setPlaylist(r.data))
      .catch(() => setPlaylist(null))
      .finally(() => setLoading(false))
  }, [playlistId])

  const mappedTracks: Track[] = (playlist?.playlistTracks ?? [])
    .sort((a, b) => a.position - b.position)
    .map(pt => mapTrack(pt.track))

  const playAll = () => {
    if (mappedTracks.length) playTrack(mappedTracks[0], mappedTracks)
  }

  const handleRename = async () => {
    if (!newName.trim() || !playlist) return
    try {
      await playlistsService.update(playlist.id, { name: newName.trim() })
      setPlaylist(prev => prev ? { ...prev, name: newName.trim() } : prev)
      setRenaming(false)
    } catch { /* ignore */ }
  }

  const handleDelete = async () => {
    if (!playlist || !window.confirm(`"${playlist.name}" silinsin mi?`)) return
    await playlistsService.delete(playlist.id).catch(() => {})
    navigate('/library')
  }

  const handleRemoveTrack = async (trackId: number) => {
    if (!playlist) return
    await playlistsService.removeTrack(playlist.id, trackId).catch(() => {})
    setPlaylist(prev => prev
      ? { ...prev, playlistTracks: prev.playlistTracks.filter(pt => pt.track.id !== trackId) }
      : prev
    )
  }

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-zinc-400">Yükleniyor…</p></div>
  if (!playlist) return <div className="flex items-center justify-center h-64"><p className="text-zinc-400">Çalma listesi bulunamadı.</p></div>

  const isOwner = user?.id === playlist.createdByUserId

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="flex gap-6 items-end bg-gradient-to-b from-green-900/40 to-transparent -mx-8 -mt-4 px-8 pt-8 pb-6">
        <div className="w-40 h-40 bg-gradient-to-br from-green-700 to-teal-900 rounded-lg flex items-center justify-center flex-shrink-0 shadow-2xl">
          <Music className="w-16 h-16 text-white/50" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white/70 text-sm font-medium mb-1">Çalma Listesi</p>
          {renaming ? (
            <div className="flex items-center gap-2 mb-2">
              <input
                autoFocus
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setRenaming(false) }}
                className="bg-zinc-800 text-white text-3xl font-bold px-3 py-1 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button onClick={handleRename} className="text-green-500 hover:text-green-400"><Check className="w-5 h-5" /></button>
              <button onClick={() => setRenaming(false)} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
          ) : (
            <h1 className="text-4xl font-extrabold text-white mb-2 truncate">{playlist.name}</h1>
          )}
          <p className="text-zinc-400 text-sm">{mappedTracks.length} şarkı</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button
          onClick={playAll}
          disabled={!mappedTracks.length}
          className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-40"
        >
          <Play className="w-6 h-6 text-black ml-1" />
        </button>
        {isOwner && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setNewName(playlist.name); setRenaming(true) }}
              className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-sm transition-colors"
            >
              <Pencil className="w-4 h-4" /> Yeniden Adlandır
            </button>
            <span className="text-zinc-700">·</span>
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 text-zinc-400 hover:text-red-400 text-sm transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Sil
            </button>
          </div>
        )}
      </div>

      {/* Track list */}
      {mappedTracks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-center bg-zinc-900 rounded-xl">
          <Music className="w-10 h-10 text-zinc-600 mb-3" />
          <p className="text-zinc-400 text-sm">Bu çalma listesi henüz boş.</p>
          <p className="text-zinc-500 text-xs mt-1">Bir şarkının menüsünden bu listeye ekleyebilirsiniz.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {mappedTracks.map((track, i) => {
            const active = currentTrack?.id === track.id
            const liked = isFavorite(track.id)
            return (
              <div
                key={track.id}
                onDoubleClick={() => playTrack(track, mappedTracks)}
                className={`grid grid-cols-[2rem_1fr_auto_auto_4rem] items-center gap-3 px-3 py-2 rounded-lg group cursor-pointer transition-colors ${active ? 'bg-zinc-700' : 'hover:bg-zinc-800'}`}
              >
                <span className={`text-sm text-center ${active ? 'text-green-400' : 'text-zinc-500'}`}>
                  {active && isPlaying ? '▶' : i + 1}
                </span>
                <div className="min-w-0">
                  <p className={`text-sm font-medium truncate ${active ? 'text-green-400' : 'text-white'}`}>{track.title}</p>
                  <div className="flex items-center gap-1 text-xs text-zinc-400">
                    <Link to={`/artist/${track.artistId}`} onClick={e => e.stopPropagation()} className="hover:underline truncate">{track.artist}</Link>
                    {track.albumId && <><span>·</span><Link to={`/album/${track.albumId}`} onClick={e => e.stopPropagation()} className="hover:underline truncate">{track.album}</Link></>}
                  </div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); toggleFavorite(track.id) }}
                  className={`transition-colors ${liked ? 'text-green-500' : 'text-zinc-500 opacity-0 group-hover:opacity-100 hover:text-white'}`}
                >
                  <Heart className={`w-4 h-4 ${liked ? 'fill-green-500' : ''}`} />
                </button>
                {isOwner && (
                  <button
                    onClick={e => { e.stopPropagation(); handleRemoveTrack(track.id) }}
                    className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <span className="text-xs text-zinc-500 text-right">{formatTime(track.duration)}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default PlaylistPage
