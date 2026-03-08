import React from 'react'
import { useParams } from 'react-router-dom'
import { Music, Calendar, Globe, Users } from 'lucide-react'

const ArtistWiki: React.FC = () => {
  const { id: _id } = useParams<{ id: string }>()

  return (
    <div className="space-y-8">
      {/* Artist Header */}
      <div className="bg-gradient-to-b from-dark-surface to-dark-bg rounded-lg p-8">
        <div className="flex items-start space-x-8">
          <div className="w-48 h-48 bg-gray-700 rounded-full flex items-center justify-center">
            <Music className="w-24 h-24 text-text-muted" />
          </div>
          
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-text-primary mb-2">Artist Name</h1>
            <p className="text-text-secondary text-lg mb-4">Artist Biography and information</p>
            
            <div className="flex items-center space-x-6 text-text-secondary">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>1.2M monthly listeners</span>
              </div>
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4" />
                <span>Country</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Born: January 1, 1990</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Biography Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-text-primary">Biography</h2>
        <div className="card">
          <p className="text-text-secondary leading-relaxed">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
            Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. 
            Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
          </p>
          <p className="text-text-secondary leading-relaxed mt-4">
            Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. 
            Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, 
            totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
          </p>
        </div>
      </div>

      {/* Popular Tracks */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-text-primary">Popular Tracks</h2>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((track) => (
            <div key={track} className="card flex items-center justify-between p-4">
              <div className="flex items-center space-x-4">
                <span className="text-text-secondary w-8">{track}</span>
                <div>
                  <h4 className="text-text-primary font-semibold">Popular Track {track}</h4>
                  <p className="text-text-secondary text-sm">Album Name</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-text-secondary text-sm">3:45</span>
                <button className="btn-primary">Play</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Albums */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-text-primary">Albums</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {[1, 2, 3, 4, 5, 6].map((album) => (
            <div key={album} className="group cursor-pointer">
              <div className="bg-dark-surface rounded-lg p-4 mb-3 group-hover:bg-dark-surface-light transition-colors">
                <div className="aspect-square bg-gray-700 rounded-md flex items-center justify-center mb-4">
                  <Music className="w-12 h-12 text-text-muted" />
                </div>
                <h4 className="text-text-primary font-semibold truncate">Album {album}</h4>
                <p className="text-text-secondary text-sm truncate">2024</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Related Artists */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-text-primary">Related Artists</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {[1, 2, 3, 4, 5, 6].map((artist) => (
            <div key={artist} className="group cursor-pointer">
              <div className="bg-dark-surface rounded-lg p-4 mb-3 group-hover:bg-dark-surface-light transition-colors">
                <div className="aspect-square bg-gray-700 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-text-primary">R{artist}</span>
                </div>
                <h4 className="text-text-primary font-semibold truncate">Related Artist {artist}</h4>
                <p className="text-text-secondary text-sm truncate">Artist</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ArtistWiki
