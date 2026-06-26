import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Cloud, Files, HardDrive, TrendingUp, RefreshCw } from 'lucide-react'
import Navbar from '../components/Navbar'
import UploadZone from '../components/UploadZone'
import FileCard from '../components/FileCard'
import { listFiles, formatFileSize, type CloudFile } from '../api/files'

export default function DashboardPage() {
  const [files, setFiles] = useState<CloudFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchFiles = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      const data = await listFiles()
      setFiles(data)
    } catch {
      setError('Impossibile caricare i file. Verifica la connessione al server.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchFiles()
  }, [])

  const handleUploadSuccess = (newFile: CloudFile) => {
    setFiles((prev) => [newFile, ...prev])
  }

  const totalSize = files.reduce((acc, f) => acc + f.size, 0)

  const stats = [
    {
      id: 'stat-files',
      label: 'File totali',
      value: files.length.toString(),
      icon: Files,
      color: 'text-nimbus-600',
      bg: 'bg-nimbus-50',
    },
    {
      id: 'stat-size',
      label: 'Spazio usato',
      value: formatFileSize(totalSize),
      icon: HardDrive,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      id: 'stat-recent',
      label: 'Caricati di recente',
      value: files.filter(f => {
        const d = new Date(f.createdAt)
        const now = new Date()
        return (now.getTime() - d.getTime()) < 7 * 24 * 60 * 60 * 1000
      }).length.toString(),
      icon: TrendingUp,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 md:pb-8">
        {/* Welcome header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
            Il tuo <span className="text-gradient">Cloud</span> ☁️
          </h1>
          <p className="text-gray-500">Gestisci e condividi i tuoi file in modo sicuro</p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-3 gap-3 sm:gap-4 mb-8"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={stat.id}
              id={stat.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.15 + i * 0.08 }}
              className="card p-3 sm:p-5 flex items-center gap-3 sm:gap-4"
            >
              <div className={`w-9 h-9 sm:w-12 sm:h-12 ${stat.bg} rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0`}>
                <stat.icon className={`w-4 h-4 sm:w-6 sm:h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{loading ? '—' : stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Upload section */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-10"
        >
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Carica file</h2>
          <UploadZone onUploadSuccess={handleUploadSuccess} />
        </motion.div>

        {/* Files section */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              I miei file
              {!loading && (
                <span className="ml-2 text-sm font-normal text-gray-400">
                  ({files.length})
                </span>
              )}
            </h2>
            <button
              id="refresh-btn"
              onClick={() => fetchFiles(true)}
              disabled={refreshing}
              className="btn-ghost text-sm"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Aggiorna
            </button>
          </div>

          {/* Error state */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card p-8 text-center"
            >
              <p className="text-red-500 font-medium mb-2">⚠️ {error}</p>
              <button onClick={() => fetchFiles()} className="btn-secondary text-sm mt-2">
                Riprova
              </button>
            </motion.div>
          )}

          {/* Loading skeleton */}
          {loading && !error && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="card p-5">
                  <div className="skeleton w-12 h-12 rounded-2xl mb-4" />
                  <div className="skeleton w-3/4 h-4 mb-2" />
                  <div className="skeleton w-1/2 h-3 mb-4" />
                  <div className="skeleton w-full h-10 rounded-xl" />
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && files.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card p-16 text-center"
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="w-20 h-20 bg-nimbus-100 rounded-3xl flex items-center justify-center mx-auto mb-6"
              >
                <Cloud className="w-10 h-10 text-nimbus-500" strokeWidth={1.5} />
              </motion.div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Nessun file caricato</h3>
              <p className="text-gray-400 max-w-sm mx-auto">
                Il tuo cloud è vuoto. Carica il tuo primo file usando la zona qui sopra!
              </p>
            </motion.div>
          )}

          {/* File grid */}
          {!loading && !error && files.length > 0 && (
            <AnimatePresence>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {files.map((file, index) => (
                  <FileCard key={file.id} file={file} index={index} />
                ))}
              </div>
            </AnimatePresence>
          )}
        </motion.div>
      </main>
    </div>
  )
}
