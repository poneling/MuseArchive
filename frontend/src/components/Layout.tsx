import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Search, Library, Music, Heart, PlusCircle, LogOut, LogIn } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Player from './Player'
import LoginModal from './LoginModal'
import { useAuthStore } from '../store/authStore'

interface LayoutProps {
  children: React.ReactNode
}

const navItems = [
  { key: 'home', href: '/', icon: Home },
  { key: 'search', href: '/search', icon: Search },
  { key: 'library', href: '/library', icon: Library },
]

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation()
  const [showLogin, setShowLogin] = useState(false)
  const { user, isAuthenticated, logout } = useAuthStore()
  const { t, i18n } = useTranslation()

  const currentLang = i18n.resolvedLanguage ?? i18n.language
  const toggleLang = () => {
    const next = currentLang === 'tr' ? 'en' : 'tr'
    i18n.changeLanguage(next)
    localStorage.setItem('musearchive-lang', next)
  }

  return (
    <div className="flex h-screen bg-black">
      {/* Sidebar */}
      <div className="w-60 bg-zinc-900 flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="px-6 pt-6 pb-4">
          <Link to="/" className="flex items-center space-x-2">
            <Music className="w-8 h-8 text-green-500" />
            <span className="text-xl font-bold text-white">MuseArchive</span>
          </Link>
        </div>

        {/* Main Navigation */}
        <nav className="px-3 space-y-1">
          {navItems.map(({ key, href, icon: Icon }) => {
            const isActive = location.pathname === href
            return (
              <Link
                key={key}
                to={href}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-zinc-700 text-white'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium text-sm">{t(`nav.${key}`)}</span>
              </Link>
            )
          })}
        </nav>

        {/* Library Section */}
        <div className="mt-6 px-3 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between px-3 mb-3">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              {t('sidebar.yourLibrary')}
            </span>
            <button className="text-zinc-400 hover:text-white transition-colors">
              <PlusCircle className="w-4 h-4" />
            </button>
          </div>

          {/* Liked Songs shortcut */}
          <Link
            to="/library"
            className="flex items-center space-x-3 px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-purple-700 to-blue-500 rounded flex items-center justify-center flex-shrink-0">
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="text-sm font-medium truncate">{t('sidebar.likedSongs')}</span>
          </Link>
        </div>

        {/* User / Auth section at bottom */}
        <div className="px-3 py-4 border-t border-zinc-800">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-black font-bold text-xs">
                  {user.username[0].toUpperCase()}
                </span>
              </div>
              <span className="text-white text-sm font-medium truncate flex-1">{user.username}</span>
              <button onClick={logout} title={t('sidebar.logout')} className="text-zinc-400 hover:text-white transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowLogin(true)}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors text-sm font-medium"
            >
              <LogIn className="w-4 h-4" />
              {t('sidebar.login')}
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-zinc-950">
        {/* Header */}
        <header className="px-8 py-4 flex items-center justify-between bg-zinc-950/80 backdrop-blur sticky top-0 z-10">
          <h1 className="text-xl font-bold text-white">
            {t(`nav.${navItems.find(n => n.href === location.pathname)?.key ?? ''}`, { defaultValue: 'MuseArchive' })}
          </h1>
          <div className="flex items-center gap-2">
            {/* Login / Avatar — left of language button */}
            {isAuthenticated && user ? (
              <div className="w-9 h-9 bg-green-500 rounded-full flex items-center justify-center cursor-pointer" title={user.username}>
                <span className="text-black font-bold text-sm">{user.username[0].toUpperCase()}</span>
              </div>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                className="bg-white text-black text-sm font-bold px-5 py-2 rounded-full hover:scale-105 transition-transform"
              >
                {t('auth.login')}
              </button>
            )}
            {/* Language switcher — shows CURRENT language; click toggles */}
            <button
              onClick={toggleLang}
              title={currentLang === 'tr' ? 'Türkçe — İngilizceye geç' : 'English — Switch to Turkish'}
              className="text-xs font-bold text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1.5 rounded-full transition-colors"
            >
              {currentLang === 'tr' ? 'TR' : 'EN'}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8 pb-28">
          {children}
        </main>
      </div>

      {/* Music Player */}
      <Player />

      {/* Login Modal */}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </div>
  )
}

export default Layout
