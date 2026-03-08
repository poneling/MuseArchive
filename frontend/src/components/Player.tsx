import React, { useRef, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Repeat, Shuffle, Heart } from 'lucide-react'
import { useMusicStore } from '../store/musicStore'

const Player: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [audioDuration, setAudioDuration] = useState(0)
  const [repeat, setRepeat] = useState(false)

  const {
    currentTrack,
    isPlaying,
    volume,
    togglePlayPause,
    nextTrack,
    prevTrack,
    shufflePlay,
    setVolume,
    setProgress,
    toggleFavorite,
    isFavorite,
  } = useMusicStore()

  // ── Reload audio when track changes ────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    setCurrentTime(0)
    setAudioDuration(0)
    audio.load()
    if (isPlaying) audio.play().catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.id])

  // ── Play / pause ────────────────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) audio.play().catch(() => {})
    else audio.pause()
  }, [isPlaying])

  // ── Volume ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  // ── Time listeners ──────────────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTime = () => {
      setCurrentTime(audio.currentTime)
      if (audio.duration > 0) setProgress((audio.currentTime / audio.duration) * 100)
    }
    const onMeta = () => setAudioDuration(audio.duration)
    const onEnd  = () => { if (repeat) audio.play().catch(() => {}); else nextTrack() }
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onMeta)
    audio.addEventListener('ended', onEnd)
    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onMeta)
      audio.removeEventListener('ended', onEnd)
    }
  }, [repeat, nextTrack, setProgress])

  // ── Helpers ─────────────────────────────────────────────────────────────
  const fmt = (t: number) => {
    if (!t || isNaN(t)) return '0:00'
    return `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio?.duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    audio.currentTime = ratio * audio.duration
  }

  const visualProgress = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0
  const liked = currentTrack ? isFavorite(currentTrack.id) : false

  return (
    <>
      <audio
        ref={audioRef}
        src={currentTrack?.audioUrl ? encodeURI(`http://localhost:5222${currentTrack.audioUrl}`) : ''}
      />

      <div className="fixed bottom-0 left-0 right-0 h-20 bg-zinc-900 border-t border-zinc-800 px-4 z-50 flex items-center justify-between gap-4">

        {/* Track Info */}
        <div className="flex items-center gap-3 w-72 min-w-0">
          <div className="w-12 h-12 bg-zinc-700 rounded flex items-center justify-center flex-shrink-0">
            <Volume2 className="w-5 h-5 text-zinc-400" />
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-semibold truncate">
              {currentTrack?.title ?? 'No track playing'}
            </p>
            <div className="flex items-center gap-1 text-xs text-zinc-400 truncate">
              {currentTrack?.artistId ? (
                <Link to={`/artist/${currentTrack.artistId}`} className="hover:underline hover:text-white transition-colors truncate">
                  {currentTrack.artist}
                </Link>
              ) : (
                <span className="truncate">{currentTrack?.artist ?? '—'}</span>
              )}
              {currentTrack?.albumId && (
                <>
                  <span className="flex-shrink-0">·</span>
                  <Link to={`/album/${currentTrack.albumId}`} className="hover:underline hover:text-white transition-colors truncate">
                    {currentTrack.album}
                  </Link>
                </>
              )}
            </div>
          </div>
          {currentTrack && (
            <button
              onClick={() => toggleFavorite(currentTrack.id)}
              className={`flex-shrink-0 transition-colors ${liked ? 'text-green-500' : 'text-zinc-500 hover:text-white'}`}
            >
              <Heart className={`w-4 h-4 ${liked ? 'fill-green-500' : ''}`} />
            </button>
          )}
        </div>

        {/* Controls + Progress */}
        <div className="flex flex-col items-center gap-1 flex-1 max-w-xl">
          <div className="flex items-center gap-5">
            <button onClick={shufflePlay} className="text-zinc-400 hover:text-white transition-colors">
              <Shuffle className="w-4 h-4" />
            </button>
            <button onClick={prevTrack} className="text-zinc-400 hover:text-white transition-colors">
              <SkipBack className="w-5 h-5" />
            </button>
            <button
              onClick={togglePlayPause}
              className="w-9 h-9 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform"
            >
              {isPlaying
                ? <Pause className="w-4 h-4 text-black" />
                : <Play className="w-4 h-4 text-black ml-0.5" />}
            </button>
            <button onClick={nextTrack} className="text-zinc-400 hover:text-white transition-colors">
              <SkipForward className="w-5 h-5" />
            </button>
            <button
              onClick={() => setRepeat(!repeat)}
              className={`transition-colors ${repeat ? 'text-green-500' : 'text-zinc-400 hover:text-white'}`}
            >
              <Repeat className="w-4 h-4" />
            </button>
          </div>

          {/* Seek bar */}
          <div className="flex items-center gap-2 w-full">
            <span className="text-zinc-400 text-xs w-8 text-right">{fmt(currentTime)}</span>
            <div
              className="flex-1 bg-zinc-700 rounded-full h-1 cursor-pointer group"
              onClick={handleSeek}
            >
              <div
                className="bg-white h-1 rounded-full group-hover:bg-green-500 transition-colors"
                style={{ width: `${visualProgress}%` }}
              />
            </div>
            <span className="text-zinc-400 text-xs w-8">{fmt(audioDuration)}</span>
          </div>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-2 w-36 justify-end">
          <button
            onClick={() => setVolume(volume > 0 ? 0 : 0.7)}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <div
            className="w-24 bg-zinc-700 rounded-full h-1 cursor-pointer group"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              setVolume((e.clientX - rect.left) / rect.width)
            }}
          >
            <div
              className="bg-white h-1 rounded-full group-hover:bg-green-500 transition-colors"
              style={{ width: `${volume * 100}%` }}
            />
          </div>
        </div>
      </div>
    </>
  )
}

export default Player
