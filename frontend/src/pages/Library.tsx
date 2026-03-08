import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, Plus, Music, User, Trash2, LogIn } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { playlistsService, artistsService } from '../services/api'
import { useMusicStore } from '../store/musicStore'
import { useAuthStore } from '../store/authStore'

interface ApiPlaylist {
  id: number
  name: string
  description?: string
  playlistTracks?: { track: { id: number } }[]
}

interface ApiArtist {
  id: number
  name: string
  bio?: string
}

const Library: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()
  const { favorites } = useMusicStore()

  const [playlists, setPlaylists] = useState<ApiPlaylist[]>([])
  const [followedArtists, setFollowedArtists] = useState<ApiArtist[]>([])
  const [loading, setLoading] = useState(false)
  const [creatingPlaylist, setCreatingPlaylist] = useState(false)
  const [newName, setNewName] = useState('')

  useEffect(() => {
    if (!user) return
    setLoading(true)
    Promise.all([
      playlistsService.getByUser(user.id).then(r => setPlaylists(r.data)).catch(() => {}),
      artistsService.getFollowed(user.id).then(r => setFollowedArtists(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [user])

  const handleCreatePlaylist = async () => {
    if (!newName.trim() || !user) return
    try {
      const res = await playlistsService.create({ name: newName.trim(), createdByUserId: user.id })
      setPlaylists(prev => [...prev, res.data])
      setNewName('')
      setCreatingPlaylist(false)
      navigate(`/playlist/${res.data.id}`)
    } catch { /* ignore */ }
  }

  const handleDeletePlaylist = async (id: number, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!window.confirm('Delete this playlist?')) return
    await playlistsService.delete(id).catch(() => {})
    setPlaylists(prev => prev.filter(p => p.id !== id))
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
        <LogIn className="w-12 h-12 text-zinc-500" />
        <p className="text-white text-xl font-bold">Kütüphanenizi görmek için giriş yapın</p>
        <p className="text-zinc-400 text-sm">Playlist oluşturmak ve favorilerinizi takip etmek için hesabınıza girin.</p>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">{t('sidebar.yourLibrary')}</h1>
        <button
          onClick={() => setCreatingPlaylist(true)}
          className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium px-4 py-2 rounded-full transition-colors"
        >
          <Plus className="w-4 h-4" />
          Yeni Çalma Listesi
        </button>
      </div>

      {/* New playlist input */}
      {creatingPlaylist && (
        <div className="flex items-center gap-3 bg-zinc-800 rounded-xl px-4 py-3">
          <Music className="w-5 h-5 text-zinc-400 flex-shrink-0" />
          <input
            autoFocus
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleCreatePlaylist(); if (e.key === 'Escape') setCreatingPlaylist(false) }}
            placeholder="Çalma listesi adı…"
            className="flex-1 bg-transparent text-white text-sm placeholder-zinc-500 focus:outline-none"
          />
          <button onClick={handleCreatePlaylist} className="text-green-500 text-sm font-semibold hover:text-green-400">Oluştur</button>
          <button onClick={() => setCreatingPlaylist(false)} className="text-zinc-500 hover:text-white text-sm">İptal</button>
        </div>
      )}

      {/* Liked Songs card */}
      <section>
        <h2 className="text-xl font-bold text-white mb-4">{t('sidebar.likedSongs')}</h2>
        <Link
          to="/liked"
          className="flex items-center gap-4 bg-gradient-to-r from-purple-700 to-blue-600 rounded-xl p-5 hover:opacity-90 transition-opacity"
        >
          <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Heart className="w-7 h-7 text-white fill-white" />
          </div>
          <div>
            <p className="text-white font-bold text-lg">{t('sidebar.likedSongs')}</p>
            <p className="text-white/70 text-sm">{favorites.length} şarkı</p>
          </div>
        </Link>
      </section>

      {/* User playlists */}
      <section>
        <h2 className="text-xl font-bold text-white mb-4">Çalma Listelerim</h2>
        {loading ? (
          <p className="text-zinc-400 text-sm">Yükleniyor…</p>
        ) : playlists.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center bg-zinc-900 rounded-xl">
            <Music className="w-10 h-10 text-zinc-600 mb-3" />
            <p className="text-zinc-400 text-sm">Henüz bir çalma listesi oluşturmadınız.</p>
            <button
              onClick={() => setCreatingPlaylist(true)}
              className="mt-3 text-green-500 text-sm font-semibold hover:underline"
            >
              İlk listeyi oluştur
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {playlists.map(pl => (
              <div key={pl.id} className="group relative bg-zinc-900 hover:bg-zinc-800 rounded-lg p-4 transition-colors">
                <Link to={`/playlist/${pl.id}`} className="block">
                  <div className="aspect-square bg-gradient-to-br from-green-700 to-teal-900 rounded-md mb-3 flex items-center justify-center">
                    <Music className="w-8 h-8 text-white/60" />
                  </div>
                  <p className="text-white text-sm font-semibold truncate">{pl.name}</p>
                  <p className="text-zinc-400 text-xs mt-0.5">{pl.playlistTracks?.length ?? 0} şarkı</p>
                </Link>
                <button
                  onClick={e => handleDeletePlaylist(pl.id, e)}
                  className="absolute top-2 right-2 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Followed Artists */}
      {followedArtists.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-white mb-4">Takip Edilen Sanatçılar</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {followedArtists.map(artist => (
              <Link
                key={artist.id}
                to={`/artist/${artist.id}`}
                className="group bg-zinc-900 hover:bg-zinc-800 rounded-lg p-4 text-center transition-colors"
              >
                <div className="w-16 h-16 bg-zinc-700 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <User className="w-7 h-7 text-zinc-400" />
                </div>
                <p className="text-white text-sm font-semibold truncate">{artist.name}</p>
                <p className="text-zinc-400 text-xs mt-0.5">Sanatçı</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default Library
