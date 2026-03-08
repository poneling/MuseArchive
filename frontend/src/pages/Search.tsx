import React, { useState } from 'react'
import { Search as SearchIcon } from 'lucide-react'

const Search: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-text-primary mb-6">Search</h2>
        
        {/* Search Bar */}
        <div className="relative max-w-2xl">
          <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-muted w-5 h-5" />
          <input
            type="text"
            placeholder="Search for artists, songs, albums, or playlists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field w-full pl-12 pr-4 py-3 text-lg"
          />
        </div>
      </div>

      {searchQuery && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-text-primary mb-4">Search Results</h3>
            <p className="text-text-secondary">
              Search functionality will be implemented with backend integration.
            </p>
          </div>
        </div>
      )}

      {!searchQuery && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-text-primary mb-4">Browse Categories</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {['Rock', 'Pop', 'Hip Hop', 'Jazz', 'Classical', 'Electronic', 'Country', 'R&B'].map((genre) => (
                <div
                  key={genre}
                  className="card p-6 text-center cursor-pointer hover:scale-105 transition-transform"
                >
                  <h4 className="text-lg font-semibold text-text-primary">{genre}</h4>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Search
