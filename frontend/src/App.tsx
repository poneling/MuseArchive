import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Search from './pages/Search'
import Library from './pages/Library'
import ArtistPage from './pages/ArtistPage'
import AlbumPage from './pages/AlbumPage'
import PlaylistPage from './pages/PlaylistPage'
import LikedSongsPage from './pages/LikedSongsPage'

function App() {
  return (
    <div className="min-h-screen bg-black">
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/library" element={<Library />} />
          <Route path="/artist/:id" element={<ArtistPage />} />
          <Route path="/album/:id" element={<AlbumPage />} />
          <Route path="/playlist/:id" element={<PlaylistPage />} />
          <Route path="/liked" element={<LikedSongsPage />} />
        </Routes>
      </Layout>
    </div>
  )
}

export default App
