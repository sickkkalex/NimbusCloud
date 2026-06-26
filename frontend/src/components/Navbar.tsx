import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  Home, Upload, FolderOpen, User,
  LogOut, Settings, ChevronDown, Bell, X,
  Star, Trash2
} from 'lucide-react'
import { useAuthStore, getDisplayName } from '../store/authStore'
import UserAvatar from './UserAvatar'

const navItems = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/files', label: 'File', icon: FolderOpen, end: false },
  { to: '/upload', label: 'Carica', icon: Upload, end: false },
  { to: '/starred', label: 'Preferiti', icon: Star, end: false },
  { to: '/trash', label: 'Cestino', icon: Trash2, end: false },
]

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [profileOpen, setProfileOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const displayName = getDisplayName(user)

  return (
    <>
      {/* ── Desktop top navbar ── */}
      <motion.header
        initial={{ y: -64, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-gray-100/80 hidden md:block"
      >
        <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
          <div className="flex items-center h-16 gap-4">

            {/* Logo */}
            <NavLink to="/" className="flex items-center gap-2.5 mr-4 flex-shrink-0">
              <motion.img
                src="/logo.png"
                alt="NimbusCloud Logo"
                whileHover={{ rotate: [0, -8, 8, 0], scale: 1.05 }}
                transition={{ duration: 0.4 }}
                className="w-9 h-9 object-contain"
              />
              <span className="text-[1.1rem] font-bold tracking-tight text-gray-900 hidden sm:block">
                Nimbus<span className="text-gradient">Cloud</span>
              </span>
            </NavLink>

            {/* Nav links */}
            <nav className="flex items-center gap-1 flex-1 overflow-x-auto no-scrollbar">
              {navItems.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `nav-link ${isActive ? 'nav-link-active' : ''}`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className="w-4 h-4" strokeWidth={isActive ? 2.5 : 2} />
                      <span className="hidden md:block">{label}</span>
                      {isActive && (
                        <motion.div
                          layoutId="nav-indicator"
                          className="absolute inset-0 bg-nimbus-50 rounded-xl -z-10"
                          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button className="btn-icon hidden sm:flex">
                <Bell className="w-[18px] h-[18px]" />
              </button>

              {/* Profile */}
              <div className="relative">
                <button
                  id="profile-btn"
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-nimbus-50 transition-all duration-200"
                >
                  <UserAvatar size="sm" />
                  <span className="text-sm font-medium text-gray-700 hidden lg:block max-w-[120px] truncate">
                    {displayName}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      key="profile-dropdown"
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.95 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                      className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-gray-100
                                 shadow-[0_8px_40px_rgba(0,0,0,0.15)] overflow-hidden z-50"
                    >
                      <div className="px-4 py-4 bg-gradient-to-br from-nimbus-50 to-white border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          <UserAvatar size="md" />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-1.5">
                        <button
                          onClick={() => { navigate('/profile'); setProfileOpen(false) }}
                          className="context-menu-item w-full rounded-xl"
                        >
                          <User className="w-4 h-4 text-gray-400" />
                          <span>Il mio profilo</span>
                        </button>
                        <button className="context-menu-item w-full rounded-xl">
                          <Settings className="w-4 h-4 text-gray-400" />
                          <span>Impostazioni</span>
                        </button>
                        <div className="context-menu-separator" />
                        <button
                          id="logout-btn"
                          onClick={handleLogout}
                          className="context-menu-item-danger w-full rounded-xl"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Disconnetti</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {profileOpen && (
          <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />
        )}
      </motion.header>

      {/* ── Mobile top header ── */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 z-40 md:hidden bg-white/95 backdrop-blur-xl border-b border-gray-100"
      >
        <div className="flex items-center justify-between px-4 h-14">
          <NavLink to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="NimbusCloud" className="w-8 h-8 object-contain" />
            <span className="text-base font-bold tracking-tight text-gray-900">
              Nimbus<span className="text-gradient">Cloud</span>
            </span>
          </NavLink>

          <button
            onClick={() => setProfileOpen(true)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-nimbus-50 transition-colors"
          >
            <UserAvatar size="sm" />
          </button>
        </div>
      </motion.header>

      {/* ── Mobile profile sheet ── */}
      <AnimatePresence>
        {profileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm md:hidden"
              onClick={() => setProfileOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 32 }}
              className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white rounded-t-3xl
                         shadow-[0_-8px_40px_rgba(0,0,0,0.15)] overflow-hidden pb-safe"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-gray-200 rounded-full" />
              </div>

              {/* User info */}
              <div className="px-5 py-4 flex items-center gap-4 border-b border-gray-50">
                <UserAvatar size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-gray-900 truncate">{displayName}</p>
                  <p className="text-sm text-gray-400 truncate">{user?.email}</p>
                  <span className="badge-green mt-1.5 inline-flex">Account attivo</span>
                </div>
                <button
                  onClick={() => setProfileOpen(false)}
                  className="p-2 rounded-xl hover:bg-gray-50 transition-colors flex-shrink-0"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Actions */}
              <div className="p-3 space-y-1">
                <button
                  onClick={() => { navigate('/profile'); setProfileOpen(false) }}
                  className="context-menu-item w-full rounded-2xl py-3.5"
                >
                  <User className="w-5 h-5 text-gray-400" />
                  <span className="text-base">Il mio profilo</span>
                </button>
                <button className="context-menu-item w-full rounded-2xl py-3.5">
                  <Settings className="w-5 h-5 text-gray-400" />
                  <span className="text-base">Impostazioni</span>
                </button>
                <button
                  onClick={() => { handleLogout(); setProfileOpen(false) }}
                  className="context-menu-item-danger w-full rounded-2xl py-3.5"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-base">Disconnetti</span>
                </button>
              </div>
              {/* safe area bottom padding */}
              <div className="h-6" />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Mobile bottom navigation ── */}
      <motion.nav
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="bg-white/95 backdrop-blur-xl border-t border-gray-100 shadow-[0_-4px_24px_rgba(0,0,0,0.07)]">
          <div className="flex items-center justify-around px-2 h-16">
            {navItems.map(({ to, label, icon: Icon, end }) => {
              const isActive = end
                ? location.pathname === to
                : location.pathname.startsWith(to)

              return (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 relative"
                >
                  <motion.div
                    animate={{ scale: isActive ? 1 : 1 }}
                    className="relative flex flex-col items-center"
                  >
                    {isActive && (
                      <motion.div
                        layoutId="mobile-nav-pill"
                        className="absolute -top-2 w-8 h-1 bg-nimbus-500 rounded-full"
                        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                      />
                    )}
                    <div className={`p-1.5 rounded-xl transition-all duration-200 ${isActive ? 'bg-nimbus-50' : ''}`}>
                      <Icon
                        className={`w-5 h-5 transition-all duration-200 ${isActive ? 'text-nimbus-600' : 'text-gray-400'}`}
                        strokeWidth={isActive ? 2.5 : 2}
                      />
                    </div>
                    <span className={`text-[10px] font-medium mt-0.5 transition-colors duration-200 ${isActive ? 'text-nimbus-600' : 'text-gray-400'}`}>
                      {label}
                    </span>
                  </motion.div>
                </NavLink>
              )
            })}
          </div>
        </div>
      </motion.nav>
    </>
  )
}
