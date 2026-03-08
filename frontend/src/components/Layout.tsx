import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Search, Library, Music } from 'lucide-react'
import Player from './Player'
import { tracksService } from '../services/api'

interface ApiTrack {
  id: number
  title: string
  duration: string
  audioUrl?: string
  album: {
    id: number
    title: string
    artist: {
      id: number
      name: string
    }
  }
}

interface Track {
  id: number
  title: string
  artist: string
  album: string
  duration: string
  audioUrl?: string
}

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation()
  const [tracks, setTracks] = useState<Track[]>([])
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [volume, setVolume] = useState(0.7)

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const response = await tracksService.getAll()
        const mapped: Track[] = (response.data as ApiTrack[]).map((t) => ({
          id: t.id,
          title: t.title,
          artist: t.album?.artist?.name ?? 'Unknown Artist',
          album: t.album?.title ?? 'Unknown Album',
          duration: t.duration ?? '',
          audioUrl: t.audioUrl,
        }))
        setTracks(mapped)
      } catch (error) {
        console.error('Error fetching tracks:', error)
      }
    }

    fetchTracks()
  }, [])

  const currentTrack = tracks[currentTrackIndex] || null

  const handlePlayPause = () => setIsPlaying(!isPlaying)
  const handlePrevious = () => {
    if (currentTrackIndex > 0) {
      setCurrentTrackIndex(currentTrackIndex - 1)
    }
  }
  const handleNext = () => {
    if (currentTrackIndex < tracks.length - 1) {
      setCurrentTrackIndex(currentTrackIndex + 1)
    }
  }
  const handleShuffle = () => {
    const randomIndex = Math.floor(Math.random() * tracks.length)
    setCurrentTrackIndex(randomIndex)
  }
  const handleRepeat = () => console.log('Toggle repeat')
  const handleSeek = (newProgress: number) => setProgress(newProgress)
  const handleVolumeChange = (newVolume: number) => setVolume(newVolume)

  const handleTrackSelect = (_track: Track, index: number) => {
    setCurrentTrackIndex(index)
    setIsPlaying(true)
  }

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Search', href: '/search', icon: Search },
    { name: 'Library', href: '/library', icon: Library },
  ]

  return (
    <div className="flex h-screen bg-black">
      {/* Sidebar */}
      <div className="w-64 bg-black p-6 flex-shrink-0">
        <div className="mb-8">
          <Link to="/" className="flex items-center space-x-2">
            <Music className="w-8 h-8 text-green-500" />
            <span className="text-2xl font-bold text-white">MuseArchive</span>
          </Link>
        </div>

        <nav className="space-y-4">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.href
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                  isActive
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* Track List */}
        <div className="mt-8 space-y-2 max-h-96 overflow-y-auto">
          <h3 className="text-gray-400 text-sm font-semibold mb-3">Tracks</h3>
          {tracks.map((track, index) => (
            <div
              key={track.id}
              onClick={() => handleTrackSelect(track, index)}
              className={`p-2 rounded cursor-pointer transition-colors ${
                currentTrack?.id === track.id
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <div className="text-sm truncate">{track.title}</div>
              <div className="text-xs truncate">{track.artist}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-gray-900 border-b border-gray-800 px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">
              {navigation.find(item => item.href === location.pathname)?.name || 'MuseArchive'}
            </h1>
            
            {/* User Profile */}
            <div className="flex items-center space-x-4">
              <button className="text-gray-400 hover:text-white transition-colors">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">U</span>
                </div>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8 pb-24">
          {children}
        </main>
      </div>

      {/* Music Player */}
      <Player
        isPlaying={isPlaying}
        currentTrack={currentTrack || undefined}
        onPlayPause={handlePlayPause}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onShuffle={handleShuffle}
        onRepeat={handleRepeat}
        progress={progress}
        onSeek={handleSeek}
        volume={volume}
        onVolumeChange={handleVolumeChange}
      />
    </div>
  )
}

export default Layout
