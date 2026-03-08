import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Search from './pages/Search'
import Library from './pages/Library'
import ArtistWiki from './pages/ArtistWiki'

function App() {
  return (
    <div className="min-h-screen bg-black">
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/library" element={<Library />} />
          <Route path="/artist/:id" element={<ArtistWiki />} />
        </Routes>
      </Layout>
    </div>
  )
}

export default App
