import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Play, Disc3, Music, Heart, UserCheck, UserPlus } from 'lucide-react'
import { artistsService, tracksService } from '../services/api'
import { useMusicStore, Track } from '../store/musicStore'
import { useAuthStore } from '../store/authStore'
import AddToPlaylistMenu from '../components/AddToPlaylistMenu'
import api from '../services/api'

interface ApiTrack {
  id: number
  title: string
  duration: string
  audioUrl?: string
  genre?: string
  playCount?: number
  album: { id: number; title: string; coverImageUrl?: string; artist: { id: number; name: string } }
}

interface ApiAlbum {
  id: number
  title: string
  coverImageUrl?: string
  releaseDate?: string
  tracks?: ApiTrack[]
}

interface ApiArtist {
  id: number
  name: string
  bio?: string
  imageUrl?: string
  albums?: ApiAlbum[]
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

const formatTime = (ts: string | undefined) => {
  if (!ts) return ''
  const parts = ts.split(':')
  if (parts.length < 2) return ts
  const m = parseInt(parts[1])
  const s = Math.floor(parseFloat(parts[2] ?? '0'))
  return `${m}:${String(s).padStart(2, '0')}`
}

const ArtistPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const artistId = parseInt(id ?? '0')

  const [artist, setArtist] = useState<ApiArtist | null>(null)
  const [tracks, setTracks] = useState<ApiTrack[]>([])
  const [wikiBio, setWikiBio] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [followed, setFollowed] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [showAllTracks, setShowAllTracks] = useState(false)

  const { playTrack, currentTrack, isPlaying, toggleFavorite, isFavorite } = useMusicStore()
  const { user, isAuthenticated } = useAuthStore()

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const [artistRes, tracksRes] = await Promise.all([
          artistsService.getById(artistId),
          tracksService.getByArtist(artistId),
        ])
        setArtist(artistRes.data)
        setTracks(tracksRes.data)

        // Fetch Wikipedia bio (non-blocking)
        api.get(`/artists/${artistId}/wiki`)
          .then(r => setWikiBio(r.data?.bio ?? null))
          .catch(() => {})

        // Check follow status
        if (user?.id) {
          artistsService.isFollowed(artistId, user.id)
            .then(r => setFollowed(r.data?.followed ?? false))
            .catch(() => {})
        }
      } catch {
        setError('Artist not found.')
      } finally {
        setLoading(false)
      }
    }
    if (artistId) load()
  }, [artistId])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-zinc-400 text-lg">Loading...</div>
    </div>
  )

  if (error || !artist) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-zinc-400">{error ?? 'Artist not found.'}</div>
    </div>
  )

  const mappedTracks = tracks.map(mapTrack)
  const albums = artist.albums ?? []

  const playAll = () => {
    if (mappedTracks.length > 0) playTrack(mappedTracks[0], mappedTracks)
  }

  const handleFollow = async () => {
    if (!isAuthenticated || !user) return
    setFollowLoading(true)
    try {
      if (followed) {
        await artistsService.unfollow(artistId, user.id)
        setFollowed(false)
      } else {
        await artistsService.follow(artistId, user.id)
        setFollowed(true)
      }
    } catch { /* ignore */ }
    finally { setFollowLoading(false) }
  }

  return (
    <div className="space-y-8 -mt-8 -mx-8">
      {/* Hero */}
      <div className="relative h-64 bg-gradient-to-b from-zinc-700 to-zinc-950 flex items-end px-8 pb-6">
        <div className="flex items-end gap-6">
          <div className="w-40 h-40 rounded-full bg-zinc-600 flex items-center justify-center shadow-2xl border-4 border-zinc-900">
            <Music className="w-16 h-16 text-zinc-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-300 uppercase tracking-widest mb-1">Artist</p>
            <h1 className="text-5xl font-extrabold text-white mb-2">{artist.name}</h1>
            <p className="text-zinc-400 text-sm">{tracks.length} tracks · {albums.length} albums</p>
          </div>
        </div>
      </div>

      <div className="px-8 space-y-10">
        {/* Play button */}
        <div className="flex items-center gap-4">
          <button
            onClick={playAll}
            disabled={!mappedTracks.length}
            className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-40"
          >
            <Play className="w-6 h-6 text-black ml-1" />
          </button>
          {isAuthenticated && (
            <button
              onClick={handleFollow}
              disabled={followLoading}
              className={`flex items-center gap-2 px-5 py-2 rounded-full border text-sm font-semibold transition-colors ${
                followed
                  ? 'border-zinc-400 text-white hover:border-red-400 hover:text-red-400'
                  : 'border-zinc-600 text-zinc-300 hover:border-white hover:text-white'
              }`}
            >
              {followed ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              {followed ? 'Takip Ediliyor' : 'Takip Et'}
            </button>
          )}
        </div>

        {/* Bio — Wikipedia preferred, falls back to DB bio */}
        {(wikiBio ?? artist.bio) && (
          <div>
            <h2 className="text-xl font-bold text-white mb-2">About</h2>
            <p className="text-zinc-400 leading-relaxed max-w-2xl">{wikiBio ?? artist.bio}</p>
          </div>
        )}

        {/* Tracks table */}
        {mappedTracks.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Popular</h2>
            <div className="space-y-1">
              {(showAllTracks ? mappedTracks : mappedTracks.slice(0, 5)).map((track, i) => {
                const active   = currentTrack?.id === track.id
                const liked    = isFavorite(track.id)
                const rawTrack = tracks[i] ?? tracks.find(t => t.id === track.id)
                return (
                  <div
                    key={track.id}
                    onDoubleClick={() => playTrack(track, mappedTracks)}
                    className={`grid grid-cols-[32px_1fr_auto_auto_auto_auto] items-center gap-4 px-4 py-2 rounded-lg group cursor-pointer transition-colors ${
                      active ? 'bg-zinc-700' : 'hover:bg-zinc-800'
                    }`}
                  >
                    <span className={`text-sm text-center ${active ? 'text-green-400' : 'text-zinc-500'}`}>
                      {active && isPlaying ? '▶' : i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className={`text-sm font-medium truncate ${active ? 'text-green-400' : 'text-white'}`}>
                        {track.title}
                      </p>
                      <p className="text-xs text-zinc-500 truncate">{track.album}</p>
                    </div>
                    {rawTrack?.playCount != null && rawTrack.playCount > 0 && (
                      <span className="text-xs text-zinc-500 w-16 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                        {rawTrack.playCount.toLocaleString()} plays
                      </span>
                    )}
                    <button
                      onClick={e => { e.stopPropagation(); toggleFavorite(track.id) }}
                      className={`opacity-0 group-hover:opacity-100 transition-opacity ${liked ? 'text-green-500 !opacity-100' : 'text-zinc-400 hover:text-white'}`}
                    >
                      <Heart className={`w-4 h-4 ${liked ? 'fill-green-500' : ''}`} />
                    </button>
                    <AddToPlaylistMenu trackId={track.id} />
                    <span className="text-xs text-zinc-500 w-10 text-right">
                      {formatTime(track.duration)}
                    </span>
                  </div>
                )
              })}
            </div>
            {mappedTracks.length > 5 && (
              <button
                onClick={() => setShowAllTracks(v => !v)}
                className="mt-3 text-sm text-zinc-400 hover:text-white font-semibold transition-colors"
              >
                {showAllTracks ? 'Daha Az Göster ▲' : `Daha Fazla Göster (${mappedTracks.length - 5} daha) ▼`}
              </button>
            )}
          </div>
        )}

        {/* Albums grid */}
        {albums.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Albums</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {albums.map(album => (
                <div key={album.id} className="bg-zinc-800 rounded-lg p-4 hover:bg-zinc-700 transition-colors cursor-pointer group">
                  <div className="aspect-square bg-zinc-700 rounded-md mb-3 flex items-center justify-center relative">
                    <Disc3 className="w-10 h-10 text-zinc-500" />
                    <button
                      onClick={() => {
                        const albumTracks = mappedTracks.filter(t => t.albumId === album.id)
                        if (albumTracks.length > 0) playTrack(albumTracks[0], albumTracks)
                      }}
                      className="absolute inset-0 m-auto w-10 h-10 bg-green-500 rounded-full items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity flex"
                    >
                      <Play className="w-4 h-4 text-black ml-0.5" />
                    </button>
                  </div>
                  <p className="text-white text-sm font-semibold truncate">{album.title}</p>
                  <p className="text-zinc-400 text-xs mt-0.5">
                    {album.releaseDate ? new Date(album.releaseDate).getFullYear() : '—'} · Album
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ArtistPage
