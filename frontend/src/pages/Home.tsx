import React, { useState, useEffect } from 'react'
import { Play, Heart, Clock } from 'lucide-react'
import { tracksService, albumsService } from '../services/api'

interface Track {
  id: number
  title: string
  duration: string
  audioUrl: string
  album: {
    id: number
    title: string
    artist: {
      id: number
      name: string
    }
  }
}

interface Album {
  id: number
  title: string
  coverImageUrl?: string
  artist: {
    id: number
    name: string
  }
}

const Home: React.FC = () => {
  const [recentlyPlayed, setRecentlyPlayed] = useState<Track[]>([])
  const [madeForYou, setMadeForYou] = useState<Album[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      console.log('🎵 Starting to fetch music data...');
      
      try {
        // Fetch recent tracks
        console.log('📡 Fetching tracks from API...');
        const tracksResponse = await tracksService.getAll();
        console.log('✅ Tracks response:', tracksResponse);
        console.log('🎵 Tracks data:', tracksResponse.data);
        
        const tracks = tracksResponse.data.slice(0, 6);
        console.log('🎵 First 6 tracks:', tracks);
        setRecentlyPlayed(tracks);

        // Fetch albums for "Made For You"
        console.log('💿 Fetching albums from API...');
        const albumsResponse = await albumsService.getAll();
        console.log('✅ Albums response:', albumsResponse);
        console.log('💿 Albums data:', albumsResponse.data);
        
        const albums = albumsResponse.data.slice(0, 4);
        console.log('💿 First 4 albums:', albums);
        setMadeForYou(albums);
        
      } catch (error: unknown) {
        console.error('❌ Error fetching data:', error);
        if (error instanceof Error) {
          console.error('❌ Error message:', error.message);
        }
      } finally {
        console.log('🏁 Fetch completed');
        setLoading(false);
      }
    }

    fetchData();
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white text-xl">Loading your music library...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-green-500 to-transparent p-8 -mx-8 -mt-8">
        <h1 className="text-4xl font-bold text-white mb-4">Good evening</h1>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {recentlyPlayed.slice(0, 6).map((track) => (
            <div key={track.id} className="bg-gray-900 bg-opacity-80 rounded-lg p-4 hover:bg-opacity-100 transition-all cursor-pointer group">
              <div className="w-full aspect-square bg-gray-700 rounded mb-4 flex items-center justify-center group-hover:bg-gray-600">
                <Play className="w-12 h-12 text-gray-400" />
              </div>
              <h4 className="text-white font-semibold text-sm truncate">{track.title}</h4>
              <p className="text-gray-400 text-xs truncate">{track.album.artist.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recently Played */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Recently played</h2>
          <button className="text-sm text-gray-400 hover:text-white transition-colors">Show all</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {recentlyPlayed.map((track) => (
            <div key={track.id} className="group cursor-pointer">
              <div className="aspect-square bg-gray-800 rounded-lg mb-4 flex items-center justify-center group-hover:bg-gray-700 transition-colors">
                <Play className="w-16 h-16 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h4 className="text-white font-semibold text-sm truncate mb-1">{track.title}</h4>
              <p className="text-gray-400 text-sm truncate">{track.album.artist.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Made For You */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Made for you</h2>
          <button className="text-sm text-gray-400 hover:text-white transition-colors">Show all</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {madeForYou.map((album) => (
            <div key={album.id} className="group cursor-pointer">
              <div className="aspect-square bg-gradient-to-br from-green-400 to-blue-500 rounded-lg mb-4 flex items-center justify-center group-hover:from-green-500 group-hover:to-blue-600 transition-all">
                <Play className="w-16 h-16 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h4 className="text-white font-semibold text-sm truncate mb-1">{album.title}</h4>
              <p className="text-gray-400 text-sm truncate">{album.artist.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex space-x-4">
        <button className="bg-white text-black px-8 py-3 rounded-full font-semibold hover:scale-105 transition-transform">
          <Play className="inline w-4 h-4 mr-2" />
          Play
        </button>
        <button className="bg-gray-800 text-white px-8 py-3 rounded-full font-semibold hover:bg-gray-700 transition-colors">
          <Heart className="inline w-4 h-4 mr-2" />
          Follow
        </button>
        <button className="bg-gray-800 text-white px-8 py-3 rounded-full font-semibold hover:bg-gray-700 transition-colors">
          <Clock className="inline w-4 h-4 mr-2" />
          More
        </button>
      </div>
    </div>
  )
}

export default Home
