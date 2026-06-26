import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useAuthStore } from './store/authStore'
import { getProfile } from './api/user'
import SplashScreen from './components/SplashScreen'
import AuthPage from './pages/AuthPage'
import HomePage from './pages/HomePage'
import UploadPage from './pages/UploadPage'
import FilesPage from './pages/FilesPage'
import ProfilePage from './pages/ProfilePage'
import SharedDownloadPage from './pages/SharedDownloadPage'

function Protected({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function PublicOnly({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <Navigate to="/" replace /> : <>{children}</>
}

export default function App() {
  const { loadFromStorage, isHydrated, isAuthenticated, updateUser } = useAuthStore()
  const [showSplash, setShowSplash] = useState(true)
  const [splashDone, setSplashDone] = useState(false)

  useEffect(() => { loadFromStorage() }, [loadFromStorage])

  useEffect(() => {
    if (isHydrated && isAuthenticated) {
      getProfile().then(updateUser).catch(() => {})
    }
  }, [isHydrated, isAuthenticated, updateUser])

  useEffect(() => {
    const timer = setTimeout(() => setSplashDone(true), 2500)
    return () => clearTimeout(timer)
  }, [])

  const ready = isHydrated && splashDone

  useEffect(() => {
    if (ready) setShowSplash(false)
  }, [ready])

  return (
    <>
      <AnimatePresence mode="wait">
        {showSplash && (
          <SplashScreen key="splash" />
        )}
      </AnimatePresence>

      {ready && (
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<PublicOnly><AuthPage /></PublicOnly>} />
            <Route path="/register" element={<PublicOnly><AuthPage /></PublicOnly>} />
            <Route path="/" element={<Protected><HomePage /></Protected>} />
            <Route path="/upload" element={<Protected><UploadPage /></Protected>} />
            <Route path="/files" element={<Protected><FilesPage /></Protected>} />
            <Route path="/profile" element={<Protected><ProfilePage /></Protected>} />
            <Route path="/share/:token" element={<SharedDownloadPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      )}
    </>
  )
}
