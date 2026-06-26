import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Star, RefreshCw } from 'lucide-react'
import Navbar from '../components/Navbar'
import FileCard from '../components/FileCard'
import Footer from '../components/Footer'
import { getStarred, type SearchResult } from '../api/search'

export default function StarredPage() {
  const [result, setResult] = useState<SearchResult>({ files: [], folders: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchStarred = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      const data = await getStarred()
      setResult(data)
    } catch {
      setError('Impossibile caricare i preferiti.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchStarred()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 md:pb-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex items-center gap-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-500">
            <Star className="w-6 h-6 fill-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Preferiti</h1>
            <p className="text-gray-500">I tuoi file e cartelle più importanti</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Elementi speciali
              {!loading && (
                <span className="ml-2 text-sm font-normal text-gray-400">
                  ({result.files.length + result.folders.length})
                </span>
              )}
            </h2>
            <button
              onClick={() => fetchStarred(true)}
              disabled={refreshing}
              className="btn-ghost text-sm"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Aggiorna
            </button>
          </div>

          {error && (
            <div className="card p-8 text-center">
              <p className="text-red-500 font-medium mb-2">⚠️ {error}</p>
              <button onClick={() => fetchStarred()} className="btn-secondary text-sm mt-2">Riprova</button>
            </div>
          )}

          {loading && !error && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="card p-5">
                  <div className="skeleton w-12 h-12 rounded-2xl mb-4" />
                  <div className="skeleton w-3/4 h-4 mb-2" />
                  <div className="skeleton w-1/2 h-3 mb-4" />
                  <div className="skeleton w-full h-10 rounded-xl" />
                </div>
              ))}
            </div>
          )}

          {!loading && !error && result.files.length === 0 && result.folders.length === 0 && (
            <div className="card p-16 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Star className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Nessun preferito</h3>
              <p className="text-gray-400">Clicca sulla stellina di un file per aggiungerlo qui.</p>
            </div>
          )}

          {!loading && !error && (
            <AnimatePresence>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {result.files.map((file, index) => (
                  <FileCard key={file.id} file={file} index={index} onRefresh={fetchStarred} />
                ))}
              </div>
            </AnimatePresence>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
  )
}
