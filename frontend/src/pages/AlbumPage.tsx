import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Play, Heart, Disc3, Clock } from 'lucide-react'
import { albumsService } from '../services/api'
import { useMusicStore, Track } from '../store/musicStore'
import AddToPlaylistMenu from '../components/AddToPlaylistMenu'

interface ApiTrack {
  id: number
  title: string
  duration: string
  audioUrl?: string
  genre?: string
  trackNumber?: number
  album?: { id: number; title: string; artist: { id: number; name: string } }
  trackArtists?: { artist: { id: number; name: string } }[]
}

interface ApiAlbum {
  id: number
  title: string
  coverImageUrl?: string
  releaseDate?: string
  genre?: string
  artist: { id: number; name: string }
  tracks: ApiTrack[]
}

const mapTrack = (t: ApiTrack, album: ApiAlbum): Track => ({
  id: t.id,
  title: t.title,
  artist: t.trackArtists?.[0]?.artist?.name ?? album.artist?.name ?? 'Unknown Artist',
  artistId: t.trackArtists?.[0]?.artist?.id ?? album.artist?.id,
  album: album.title,
  albumId: album.id,
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

const AlbumPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const albumId = parseInt(id ?? '0')

  const [album, setAlbum] = useState<ApiAlbum | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { playTrack, currentTrack, isPlaying, toggleFavorite, isFavorite } = useMusicStore()

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await albumsService.getById(albumId)
        setAlbum(res.data)
      } catch {
        setError('Album not found.')
      } finally {
        setLoading(false)
      }
    }
    if (albumId) load()
  }, [albumId])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-zinc-400 text-lg">Loading…</div>
    </div>
  )

  if (error || !album) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-zinc-400">{error ?? 'Album not found.'}</div>
    </div>
  )

  const sortedTracks = [...album.tracks].sort((a, b) => (a.trackNumber ?? 0) - (b.trackNumber ?? 0))
  const mappedTracks = sortedTracks.map(t => mapTrack(t, album))
  const playAll = () => { if (mappedTracks.length) playTrack(mappedTracks[0], mappedTracks) }
  const year = album.releaseDate ? new Date(album.releaseDate).getFullYear() : null

  return (
    <div className="space-y-8 -mt-8 -mx-8">
      {/* Hero */}
      <div className="flex items-end gap-6 bg-gradient-to-b from-zinc-700 to-zinc-950 px-8 pt-14 pb-8">
        {/* Cover */}
        <div className="w-48 h-48 flex-shrink-0 rounded-lg shadow-2xl overflow-hidden bg-zinc-600 flex items-center justify-center">
          {album.coverImageUrl ? (
            <img
              src={`http://localhost:5222${album.coverImageUrl}`}
              alt={album.title}
              className="w-full h-full object-cover"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          ) : (
            <Disc3 className="w-20 h-20 text-zinc-400" />
          )}
        </div>

        {/* Meta */}
        <div className="pb-1">
          <p className="text-xs font-semibold text-zinc-300 uppercase tracking-widest mb-1">Album</p>
          <h1 className="text-5xl font-extrabold text-white mb-3">{album.title}</h1>
          <div className="flex items-center gap-2 text-sm text-zinc-300">
            <Link to={`/artist/${album.artist?.id}`} className="font-semibold hover:underline text-white">
              {album.artist?.name}
            </Link>
            {year && <><span className="text-zinc-500">·</span><span>{year}</span></>}
            <span className="text-zinc-500">·</span>
            <span>{sortedTracks.length} songs</span>
            {album.genre && <><span className="text-zinc-500">·</span><span>{album.genre}</span></>}
          </div>
        </div>
      </div>

      <div className="px-8 space-y-6">
        {/* Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={playAll}
            disabled={!mappedTracks.length}
            className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-40"
          >
            <Play className="w-6 h-6 text-black ml-1" />
          </button>
        </div>

        {/* Track list */}
        {mappedTracks.length > 0 && (
          <div>
            {/* Header row */}
            <div className="grid grid-cols-[32px_1fr_auto_auto_auto] items-center gap-4 px-4 pb-2 border-b border-zinc-800 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              <span className="text-center">#</span>
              <span>Title</span>
              <span></span>
              <span></span>
              <Clock className="w-3.5 h-3.5 justify-self-end" />
            </div>

            <div className="space-y-1 mt-2">
              {mappedTracks.map((track, i) => {
                const active = currentTrack?.id === track.id
                const liked  = isFavorite(track.id)
                return (
                  <div
                    key={track.id}
                    onDoubleClick={() => playTrack(track, mappedTracks)}
                    className={`grid grid-cols-[32px_1fr_auto_auto_auto] items-center gap-4 px-4 py-2 rounded-lg group cursor-pointer transition-colors ${
                      active ? 'bg-zinc-700' : 'hover:bg-zinc-800'
                    }`}
                  >
                    {/* Track number / playing indicator */}
                    <span className={`text-sm text-center group-hover:hidden ${active ? 'text-green-400 hidden' : 'text-zinc-500'}`}>
                      {i + 1}
                    </span>
                    <button
                      onClick={() => playTrack(track, mappedTracks)}
                      className={`text-sm text-center hidden group-hover:block ${active ? '!block' : ''} ${active ? 'text-green-400' : 'text-white'}`}
                    >
                      {active && isPlaying ? '⏸' : '▶'}
                    </button>

                    {/* Title + artist */}
                    <div className="min-w-0">
                      <p className={`text-sm font-medium truncate ${active ? 'text-green-400' : 'text-white'}`}>
                        {track.title}
                      </p>
                      <Link
                        to={`/artist/${track.artistId}`}
                        onClick={e => e.stopPropagation()}
                        className="text-xs text-zinc-400 hover:underline"
                      >
                        {track.artist}
                      </Link>
                    </div>

                    {/* Like */}
                    <button
                      onClick={e => { e.stopPropagation(); toggleFavorite(track.id) }}
                      className={`transition-opacity ${liked ? 'text-green-500' : 'opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-white'}`}
                    >
                      <Heart className={`w-4 h-4 ${liked ? 'fill-green-500' : ''}`} />
                    </button>

                    {/* Add to playlist */}
                    <AddToPlaylistMenu trackId={track.id} />

                    {/* Duration */}
                    <span className="text-xs text-zinc-500 w-10 text-right">
                      {formatTime(track.duration)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AlbumPage
