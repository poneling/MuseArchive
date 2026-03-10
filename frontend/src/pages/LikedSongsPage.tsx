import React from 'react'
import { Link } from 'react-router-dom'
import { Heart, Play } from 'lucide-react'
import { useMusicStore, Track } from '../store/musicStore'
import { tracksService } from '../services/api'

interface ApiTrack {
  id: number; title: string; duration: string; audioUrl?: string; genre?: string
  album: { id: number; title: string; artist: { id: number; name: string } }
}

const formatTime = (ts: string | undefined) => {
  if (!ts) return ''
  const parts = ts.split(':')
  if (parts.length < 2) return ts
  return `${parseInt(parts[1])}:${String(Math.floor(parseFloat(parts[2] ?? '0'))).padStart(2, '0')}`
}

const mapTrack = (t: ApiTrack): Track => ({
  id: t.id, title: t.title,
  artist: t.album?.artist?.name ?? 'Unknown Artist', artistId: t.album?.artist?.id,
  album: t.album?.title ?? 'Unknown Album', albumId: t.album?.id,
  duration: t.duration ?? '', audioUrl: t.audioUrl, genre: t.genre,
})

const LikedSongsPage: React.FC = () => {
  const { favorites, playTrack, currentTrack, isPlaying, toggleFavorite } = useMusicStore()
  const [tracks, setTracks] = React.useState<ApiTrack[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    tracksService.getAll(500)
      .then(r => setTracks(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const likedTracks = tracks.filter(t => favorites.includes(t.id))
  const mapped = likedTracks.map(mapTrack)

  const playAll = () => { if (mapped.length) playTrack(mapped[0], mapped) }

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="flex gap-6 items-end bg-gradient-to-b from-purple-900/60 to-transparent -mx-8 -mt-4 px-8 pt-8 pb-6">
        <div className="w-40 h-40 bg-gradient-to-br from-purple-700 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-2xl">
          <Heart className="w-16 h-16 text-white fill-white" />
        </div>
        <div>
          <p className="text-white/70 text-sm font-medium mb-1">Çalma Listesi</p>
          <h1 className="text-4xl font-extrabold text-white mb-2">Beğenilen Şarkılar</h1>
          <p className="text-zinc-400 text-sm">{likedTracks.length} şarkı</p>
        </div>
      </div>

      {/* Play button */}
      <button
        onClick={playAll}
        disabled={!mapped.length}
        className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-40"
      >
        <Play className="w-6 h-6 text-black ml-1" />
      </button>

      {/* Track list */}
      {loading ? (
        <p className="text-zinc-400 text-sm">Yükleniyor…</p>
      ) : likedTracks.length === 0 ? (
        <div className="text-center py-14 bg-zinc-900 rounded-xl">
          <Heart className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-400 text-sm">Henüz beğenilen şarkı yok.</p>
          <p className="text-zinc-500 text-xs mt-1">Bir şarkının yanındaki ♡ ikonuna basın.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {mapped.map((track, i) => {
            const active = currentTrack?.id === track.id
            return (
              <div
                key={track.id}
                onDoubleClick={() => playTrack(track, mapped)}
                className={`grid grid-cols-[2rem_1fr_auto_4rem] items-center gap-3 px-3 py-2 rounded-lg group cursor-pointer transition-colors ${active ? 'bg-zinc-700' : 'hover:bg-zinc-800'}`}
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
                  className="text-green-500 hover:text-red-400 transition-colors"
                >
                  <Heart className="w-4 h-4 fill-green-500" />
                </button>
                <span className="text-xs text-zinc-500 text-right">{formatTime(track.duration)}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default LikedSongsPage
