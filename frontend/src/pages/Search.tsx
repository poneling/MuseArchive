import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Search as SearchIcon, Music, User, Disc3, Play, Loader2, Heart } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { searchService, tracksService } from '../services/api'
import { useMusicStore, Track } from '../store/musicStore'

interface ApiTrack {
  id: number; title: string; duration: string; audioUrl?: string; genre?: string
  album: { id: number; title: string; artist: { id: number; name: string } }
}
interface ApiArtist { id: number; name: string; bio?: string }
interface ApiAlbum  { id: number; title: string; artist?: { id: number; name: string } }

interface SearchResults {
  tracks: ApiTrack[]
  artists: ApiArtist[]
  albums: ApiAlbum[]
}

const GENRES = [
  { name: 'Hip Hop',    color: 'from-orange-600 to-orange-900' },
  { name: 'Pop',        color: 'from-pink-600 to-pink-900' },
  { name: 'Rock',       color: 'from-red-600 to-red-900' },
  { name: 'Jazz',       color: 'from-blue-600 to-blue-900' },
  { name: 'Electronic', color: 'from-purple-600 to-purple-900' },
  { name: 'R&B',        color: 'from-yellow-600 to-yellow-900' },
  { name: 'Classical',  color: 'from-green-700 to-green-950' },
  { name: 'Country',    color: 'from-amber-700 to-amber-950' },
]

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

const Search: React.FC = () => {
  const { t } = useTranslation()
  const [query, setQuery]           = useState('')
  const [results, setResults]       = useState<SearchResults | null>(null)
  const [genreTracks, setGenreTracks] = useState<ApiTrack[] | null>(null)
  const [activeGenre, setActiveGenre] = useState<string | null>(null)
  const [loading, setLoading]       = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { playTrack, currentTrack, isPlaying, toggleFavorite, isFavorite } = useMusicStore()

  // ── Debounced search ─────────────────────────────────────────────────────
  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults(null); return }
    setLoading(true)
    try {
      const res = await searchService.search(q, 10)
      setResults(res.data)
    } catch {
      setResults(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setActiveGenre(null)
    setGenreTracks(null)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => runSearch(query), 350)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, runSearch])

  // ── Genre click ──────────────────────────────────────────────────────────
  const handleGenre = async (genre: string) => {
    if (activeGenre === genre) { setActiveGenre(null); setGenreTracks(null); return }
    setActiveGenre(genre)
    setLoading(true)
    try {
      const res = await tracksService.getByGenre(genre)
      setGenreTracks(res.data)
    } catch {
      setGenreTracks([])
    } finally {
      setLoading(false)
    }
  }

  const playAll = (tracks: ApiTrack[]) => {
    const mapped = tracks.map(mapTrack)
    if (mapped.length) playTrack(mapped[0], mapped)
  }

  // ── Track row ────────────────────────────────────────────────────────────
  const TrackRow = ({ track, queue }: { track: ApiTrack; queue: ApiTrack[] }) => {
    const mapped = mapTrack(track)
    const active = currentTrack?.id === track.id
    const liked  = isFavorite(track.id)
    return (
      <div
        onDoubleClick={() => playTrack(mapped, queue.map(mapTrack))}
        className={`grid grid-cols-[1fr_auto_auto] items-center gap-4 px-3 py-2 rounded-lg group cursor-pointer transition-colors ${active ? 'bg-zinc-700' : 'hover:bg-zinc-800'}`}
      >
        <div className="min-w-0 flex items-center gap-3">
          <div className="w-9 h-9 bg-zinc-700 rounded flex items-center justify-center flex-shrink-0 group-hover:hidden">
            <Music className="w-4 h-4 text-zinc-400" />
          </div>
          <button
            onClick={() => playTrack(mapped, queue.map(mapTrack))}
            className="w-9 h-9 bg-zinc-600 rounded items-center justify-center flex-shrink-0 hidden group-hover:flex"
          >
            {active && isPlaying ? '⏸' : <Play className="w-3 h-3 text-white ml-0.5" />}
          </button>
          <div className="min-w-0">
            <p className={`text-sm font-medium truncate ${active ? 'text-green-400' : 'text-white'}`}>{track.title}</p>
            <Link
              to={`/artist/${track.album?.artist?.id}`}
              onClick={e => e.stopPropagation()}
              className="text-xs text-zinc-400 hover:underline truncate"
            >
              {track.album?.artist?.name ?? 'Unknown'}
            </Link>
          </div>
        </div>
        <button
          onClick={e => { e.stopPropagation(); toggleFavorite(track.id) }}
          className={`transition-opacity ${liked ? 'text-green-500' : 'text-zinc-500 opacity-0 group-hover:opacity-100 hover:text-white'}`}
        >
          <Heart className={`w-4 h-4 ${liked ? 'fill-green-500' : ''}`} />
        </button>
        <span className="text-xs text-zinc-500 w-10 text-right">{formatTime(track.duration)}</span>
      </div>
    )
  }

  const hasResults = results && (results.tracks.length + results.artists.length + results.albums.length > 0)

  return (
    <div className="space-y-8">
      {/* Search bar */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-5">{t('search.title')}</h1>
        <div className="relative max-w-xl">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5 pointer-events-none" />
          {loading && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4 animate-spin" />
          )}
          <input
            type="text"
            autoFocus
            placeholder={t('search.placeholder')}
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-zinc-800 text-white placeholder-zinc-500 rounded-full pl-12 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
          />
        </div>
      </div>

      {/* ── Search results ── */}
      {query && !loading && !hasResults && (
        <p className="text-zinc-400">{t('search.noResults')} <span className="text-white font-semibold">"{query}"</span>.</p>
      )}

      {hasResults && (
        <div className="space-y-8">
          {/* Tracks */}
          {results!.tracks.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-bold text-white">{t('search.songs')}</h2>
                <button
                  onClick={() => playAll(results!.tracks)}
                  className="text-xs text-zinc-400 hover:text-white flex items-center gap-1"
                >
                  <Play className="w-3 h-3" /> {t('search.playAll')}
                </button>
              </div>
              <div className="space-y-1">
                {results!.tracks.map(tr => (
                  <TrackRow key={tr.id} track={tr} queue={results!.tracks} />
                ))}
              </div>
            </section>
          )}

          {/* Artists */}
          {results!.artists.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-white mb-3">{t('search.artists')}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {results!.artists.map(a => (
                  <Link
                    key={a.id}
                    to={`/artist/${a.id}`}
                    className="bg-zinc-800 rounded-lg p-4 hover:bg-zinc-700 transition-colors text-center group"
                  >
                    <div className="w-16 h-16 bg-zinc-600 rounded-full mx-auto mb-3 flex items-center justify-center">
                      <User className="w-7 h-7 text-zinc-400" />
                    </div>
                    <p className="text-white text-sm font-semibold truncate">{a.name}</p>
                    <p className="text-zinc-400 text-xs mt-0.5">Artist</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Albums */}
          {results!.albums.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-white mb-3">{t('search.albums')}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {results!.albums.map(a => (
                  <div key={a.id} className="bg-zinc-800 rounded-lg p-4 hover:bg-zinc-700 transition-colors cursor-pointer">
                    <div className="aspect-square bg-zinc-700 rounded-md mb-3 flex items-center justify-center">
                      <Disc3 className="w-8 h-8 text-zinc-500" />
                    </div>
                    <p className="text-white text-sm font-semibold truncate">{a.title}</p>
                    {a.artist && (
                      <Link
                        to={`/artist/${a.artist.id}`}
                        onClick={e => e.stopPropagation()}
                        className="text-zinc-400 text-xs hover:underline truncate block"
                      >
                        {a.artist.name}
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* ── Browse Categories (shown when no search query) ── */}
      {!query && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4">{t('search.browseCategories')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {GENRES.map(({ name, color }) => (
              <button
                key={name}
                onClick={() => handleGenre(name)}
                className={`relative overflow-hidden rounded-lg p-5 text-left h-24 bg-gradient-to-br ${color} hover:scale-[1.02] transition-transform ${
                  activeGenre === name ? 'ring-2 ring-white' : ''
                }`}
              >
                <span className="text-white font-bold text-lg">{name}</span>
                <Disc3 className="absolute -bottom-2 -right-2 w-14 h-14 text-white/20 rotate-12" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Genre results */}
      {activeGenre && genreTracks !== null && !query && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-white">{activeGenre}</h2>
            {genreTracks.length > 0 && (
              <button
                onClick={() => playAll(genreTracks)}
                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1"
              >
                <Play className="w-3 h-3" /> Play all
              </button>
            )}
          </div>
          {genreTracks.length === 0
            ? <p className="text-zinc-400">No tracks found for this genre.</p>
            : <div className="space-y-1">
                {genreTracks.map(gt => (
                  <TrackRow key={gt.id} track={gt} queue={genreTracks} />
                ))}
              </div>
          }
        </section>
      )}
    </div>
  )
}

export default Search
