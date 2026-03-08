import React from 'react'
import { Heart, Plus, Music } from 'lucide-react'

const Library: React.FC = () => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-text-primary mb-6">Your Library</h2>
        
        <div className="flex space-x-4 mb-8">
          <button className="btn-primary flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Create Playlist</span>
          </button>
          
          <button className="btn-secondary flex items-center space-x-2">
            <Heart className="w-5 h-5" />
            <span>Liked Songs</span>
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold text-text-primary mb-4">Playlists</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="group cursor-pointer">
                <div className="bg-dark-surface rounded-lg p-4 mb-3 group-hover:bg-dark-surface-light transition-colors">
                  <div className="aspect-square bg-gradient-to-br from-primary to-primary-hover rounded-md flex items-center justify-center mb-4">
                    <Music className="w-12 h-12 text-white" />
                  </div>
                  <h4 className="text-text-primary font-semibold truncate">My Playlist {i}</h4>
                  <p className="text-text-secondary text-sm truncate">Playlist • {i * 10} songs</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold text-text-primary mb-4">Favorite Artists</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="group cursor-pointer">
                <div className="bg-dark-surface rounded-lg p-4 mb-3 group-hover:bg-dark-surface-light transition-colors">
                  <div className="aspect-square bg-gray-700 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl font-bold text-text-primary">A{i}</span>
                  </div>
                  <h4 className="text-text-primary font-semibold truncate">Artist {i}</h4>
                  <p className="text-text-secondary text-sm truncate">Artist</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold text-text-primary mb-4">Recent Albums</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="group cursor-pointer">
                <div className="bg-dark-surface rounded-lg p-4 mb-3 group-hover:bg-dark-surface-light transition-colors">
                  <div className="aspect-square bg-gray-700 rounded-md flex items-center justify-center mb-4">
                    <Music className="w-12 h-12 text-text-muted" />
                  </div>
                  <h4 className="text-text-primary font-semibold truncate">Album {i}</h4>
                  <p className="text-text-secondary text-sm truncate">Artist {i}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Library
