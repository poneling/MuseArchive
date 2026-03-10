import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Play, Heart, Disc3, Music, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { tracksService, albumsService } from '../services/api'
import { useMusicStore, Track, RawTrack, RawAlbum } from '../store/musicStore'

const mapTrack = (t: RawTrack): Track => ({
  id: t.id, title: t.title,
  artist: t.album?.artist?.name ?? 'Unknown Artist',
  artistId: t.album?.artist?.id,
  album: t.album?.title ?? 'Unknown Album',
  albumId: t.album?.id,
  duration: t.duration ?? '', audioUrl: t.audioUrl, genre: t.genre,
})

// ── Skeleton components ──────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="bg-zinc-900 rounded-lg p-4 animate-pulse">
    <div className="aspect-square bg-zinc-700 rounded mb-3" />
    <div className="h-3.5 bg-zinc-700 rounded w-3/4 mb-2" />
    <div className="h-3 bg-zinc-800 rounded w-1/2" />
  </div>
)

const SkeletonRow = () => (
  <div className="flex items-center gap-3 rounded-md overflow-hidden bg-zinc-800 h-12 animate-pulse">
    <div className="w-12 h-12 bg-zinc-700 flex-shrink-0" />
    <div className="flex-1 h-3 bg-zinc-700 rounded mr-4" />
  </div>
)

const Home: React.FC = () => {
  const { t } = useTranslation()
  const hour = new Date().getHours()
  const greeting = t(hour < 12 ? 'home.goodMorning' : hour < 17 ? 'home.goodAfternoon' : 'home.goodEvening')

  const {
    recentlyPlayed, favorites, playTrack, currentTrack, isPlaying,
    toggleFavorite, isFavorite,
    cachedTracks, cachedAlbums, isInitialLoaded, setCachedData, clearCache,
  } = useMusicStore()

  const [loading, setLoading] = useState(!isInitialLoaded)

  useEffect(() => {
    if (isInitialLoaded) return          // already have data — skip fetch
    const load = async () => {
      setLoading(true)
      try {
        const [tr, al] = await Promise.all([tracksService.getAll(), albumsService.getAll()])
        setCachedData(tr.data as RawTrack[], al.data as RawAlbum[])
      } catch { /* silent */ }
      finally { setLoading(false) }
    }
    load()
  }, [isInitialLoaded])                  // re-run only when cache is cleared

  const handleRefresh = () => {
    clearCache()                          // triggers useEffect to re-fetch
  }

  const allTracks = cachedTracks
  const albums    = cachedAlbums

  const mappedAll = allTracks.map(mapTrack)
  const quickPicks = (recentlyPlayed.length > 0 ? recentlyPlayed : mappedAll).slice(0, 8)
  const favoriteTracks = mappedAll.filter(tr => favorites.includes(tr.id)).slice(0, 10)

  // ── Reusable card ────────────────────────────────────────────────────────
  const TrackCard = ({ track, queue }: { track: Track; queue: Track[] }) => {
    const active = currentTrack?.id === track.id
    const liked  = isFavorite(track.id)
    return (
      <div
        className="group relative bg-zinc-900 hover:bg-zinc-800 rounded-lg p-4 transition-colors cursor-pointer"
        onDoubleClick={() => playTrack(track, queue)}
      >
        <div className="aspect-square bg-zinc-700 rounded mb-3 flex items-center justify-center relative overflow-hidden">
          <Music className="w-10 h-10 text-zinc-500 pointer-events-none" />
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={e => { e.stopPropagation(); playTrack(track, queue) }}
              className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
            >
              {active && isPlaying
                ? <span className="text-black text-xs">⏸</span>
                : <Play className="w-4 h-4 text-black ml-0.5" />}
            </button>
          </div>
        </div>
        <p className={`text-sm font-semibold truncate ${active ? 'text-green-400' : 'text-white'}`}>
          {track.title}
        </p>
        <Link
          to={track.artistId ? `/artist/${track.artistId}` : '#'}
          onClick={e => e.stopPropagation()}
          className="text-xs text-zinc-400 hover:underline truncate block mt-0.5"
        >
          {track.artist}
        </Link>
        <button
          onClick={e => { e.stopPropagation(); toggleFavorite(track.id) }}
          className={`absolute top-3 right-3 transition-opacity ${liked ? 'opacity-100 text-green-500' : 'opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-white'}`}
        >
          <Heart className={`w-4 h-4 ${liked ? 'fill-green-500' : ''}`} />
        </button>
      </div>
    )
  }

  // ── Quick-pick row (hero area) ───────────────────────────────────────────
  const QuickPickRow = ({ track, queue }: { track: Track; queue: Track[] }) => {
    const active = currentTrack?.id === track.id
    return (
      <div
        onClick={() => playTrack(track, queue)}
        className={`flex items-center gap-3 rounded-md overflow-hidden cursor-pointer transition-colors ${active ? 'bg-zinc-700' : 'bg-zinc-800 hover:bg-zinc-700'}`}
      >
        <div className="w-12 h-12 bg-zinc-600 flex items-center justify-center flex-shrink-0">
          <Music className="w-5 h-5 text-zinc-400" />
        </div>
        <span className={`text-sm font-semibold truncate flex-1 pr-2 ${active ? 'text-green-400' : 'text-white'}`}>
          {track.title}
        </span>
        <span className="text-zinc-500 text-xs pr-3">{track.artist}</span>
      </div>
    )
  }

  if (loading) return (
    <div className="space-y-10 -mt-4">
      <div className="bg-gradient-to-b from-green-900/60 to-transparent -mx-8 -mt-4 px-8 pt-8 pb-6">
        <div className="h-9 bg-zinc-700 rounded w-64 mb-5 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      </div>
      <section>
        <div className="h-7 bg-zinc-800 rounded w-40 mb-4 animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </section>
    </div>
  )

  return (
    <div className="space-y-10 -mt-4">
      {/* ── Hero ── */}
      <div className="bg-gradient-to-b from-green-900/60 to-transparent -mx-8 -mt-4 px-8 pt-8 pb-6">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-3xl font-extrabold text-white">{greeting}</h1>
          <button
            onClick={handleRefresh}
            title="Yenile"
            className="text-zinc-500 hover:text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {quickPicks.map(track => (
            <QuickPickRow key={track.id} track={track} queue={quickPicks} />
          ))}
        </div>
      </div>

      {/* ── Recently Played ── */}
      {recentlyPlayed.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">{t('home.recentlyPlayed')}</h2>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {recentlyPlayed.slice(0, 15).map(track => (
              <div key={track.id} className="flex-shrink-0 w-40">
                <TrackCard track={track} queue={recentlyPlayed} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Favorites ── */}
      {favoriteTracks.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">{t('home.likedSongs')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {favoriteTracks.map(track => (
              <TrackCard key={track.id} track={track} queue={favoriteTracks} />
            ))}
          </div>
        </section>
      )}

      {/* ── Albums ── */}
      {albums.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">{t('home.albums')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {albums.slice(0, 10).map(album => {
              const albumTracks = mappedAll.filter(tr => tr.albumId === album.id)
              return (
                <div key={album.id} className="group bg-zinc-900 hover:bg-zinc-800 rounded-lg p-4 transition-colors">
                  <Link to={`/album/${album.id}`} className="block aspect-square bg-zinc-700 rounded mb-3 overflow-hidden relative">
                    {album.coverImageUrl
                      ? <img src={`http://localhost:5222${album.coverImageUrl}`} alt={album.title} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      : <Disc3 className="w-10 h-10 text-zinc-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    }
                    <button
                      onClick={e => { e.preventDefault(); albumTracks.length && playTrack(albumTracks[0], albumTracks) }}
                      className="absolute inset-0 m-auto w-10 h-10 bg-green-500 rounded-full items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity flex shadow-lg"
                    >
                      <Play className="w-4 h-4 text-black ml-0.5" />
                    </button>
                  </Link>
                  <Link to={`/album/${album.id}`} className="text-white text-sm font-semibold truncate block hover:underline">{album.title}</Link>
                  <Link to={`/artist/${album.artist?.id}`} className="text-zinc-400 text-xs hover:underline truncate block mt-0.5">
                    {album.artist?.name ?? 'Unknown'}
                  </Link>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── All Tracks (fallback when no recent/favorites) ── */}
      {recentlyPlayed.length === 0 && (
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">{t('home.allTracks')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {mappedAll.slice(0, 20).map(track => (
              <TrackCard key={track.id} track={track} queue={mappedAll} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default Home
