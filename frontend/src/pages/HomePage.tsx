import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import {
  Image, Film, Music, FileText, Archive, Code, File as FileIcon,
  Download, Eye, Search, Grid3x3, List, RefreshCw, Cloud,
  Calendar, HardDrive,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import DeveloperChat from '../components/DeveloperChat'
import FileViewer from '../components/FileViewer'
import Footer from '../components/Footer'
import { listFiles, downloadFile, formatFileSize, getFileCategory, type CloudFile } from '../api/files'

const getIconConfig = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return { Icon: Image, color: 'text-violet-500', bg: 'bg-violet-50', border: 'border-violet-100' }
  if (mimeType.startsWith('video/')) return { Icon: Film, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100' }
  if (mimeType.startsWith('audio/')) return { Icon: Music, color: 'text-pink-500', bg: 'bg-pink-50', border: 'border-pink-100' }
  if (mimeType.includes('pdf')) return { Icon: FileText, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100' }
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar'))
    return { Icon: Archive, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100' }
  if (mimeType.includes('javascript') || mimeType.includes('json') || mimeType.includes('html'))
    return { Icon: Code, color: 'text-cyan-500', bg: 'bg-cyan-50', border: 'border-cyan-100' }
  if (mimeType.startsWith('text/'))
    return { Icon: FileText, color: 'text-nimbus-600', bg: 'bg-nimbus-50', border: 'border-nimbus-100' }
  return { Icon: FileIcon, color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-100' }
}

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })

const categories = [
  { key: 'all', label: 'Tutti', icon: Grid3x3 },
  { key: 'image', label: 'Foto', icon: Image },
  { key: 'video', label: 'Video', icon: Film },
  { key: 'audio', label: 'Audio', icon: Music },
  { key: 'document', label: 'Documenti', icon: FileText },
  { key: 'other', label: 'Altro', icon: Archive },
]

export default function HomePage() {
  const [files, setFiles] = useState<CloudFile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [viewerFile, setViewerFile] = useState<CloudFile | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchFiles = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const data = await listFiles()
      setFiles(data)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { fetchFiles() }, [])

  const filtered = files.filter(f => {
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = category === 'all' || getFileCategory(f.mimeType) === category
    return matchSearch && matchCat
  })

  const handleDownload = async (f: CloudFile) => {
    setDownloading(f.id)
    try { await downloadFile(f.id, f.name) }
    finally { setDownloading(null) }
  }

  const viewerFiles = filtered // For arrow navigation within current view

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
  }
  const itemVariants = {
    hidden: { opacity: 0, y: 16, scale: 0.97 },
    show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #f8fffe 50%, #f0fdf4 100%)' }}>
      <Navbar />

      {/* File Viewer Modal */}
      <FileViewer
        file={viewerFile}
        files={viewerFiles}
        onClose={() => setViewerFile(null)}
        onNavigate={setViewerFile}
      />

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-10 pb-24 md:pb-10">
        {/* Hero header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10"
        >
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2 tracking-tight">
                Il tuo <span className="text-gradient">Cloud</span> ☁️
              </h1>
              <p className="text-gray-500 text-lg">
                {files.length} file salvati • sola lettura
              </p>
            </div>
            <button
              onClick={() => fetchFiles(true)}
              disabled={refreshing}
              className="btn-ghost"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Aggiorna
            </button>
          </div>
        </motion.div>

        {/* Search + filters */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-3 mb-8"
        >
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cerca file..."
              className="input-field pl-10"
            />
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-gray-100 shadow-sm h-fit self-end sm:self-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all duration-200 ${viewMode === 'grid' ? 'bg-nimbus-100 text-nimbus-700' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all duration-200 ${viewMode === 'list' ? 'bg-nimbus-100 text-nimbus-700' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        {/* Category pills */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="flex gap-2 mb-8 overflow-x-auto scrollbar-hide pb-1"
        >
          {categories.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setCategory(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap
                         flex-shrink-0 transition-all duration-200 border
                         ${category === key
                           ? 'bg-nimbus-500 text-white border-nimbus-500 shadow-green-sm'
                           : 'bg-white text-gray-600 border-gray-100 hover:border-nimbus-200 hover:text-nimbus-700 shadow-sm'
                         }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
              {key !== 'all' && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${category === key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                  {files.filter(f => getFileCategory(f.mimeType) === key).length}
                </span>
              )}
            </button>
          ))}
        </motion.div>

        {/* Loading */}
        {loading && (
          <div className={viewMode === 'grid'
            ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4'
            : 'flex flex-col gap-3'
          }>
            {[...Array(12)].map((_, i) => (
              <div key={i} className={`card ${viewMode === 'grid' ? 'p-5' : 'p-4 flex items-center gap-4'}`}>
                <div className={`skeleton ${viewMode === 'grid' ? 'w-12 h-12 mb-4' : 'w-10 h-10 flex-shrink-0'}`} />
                <div className="flex-1">
                  <div className="skeleton w-3/4 h-4 mb-2" />
                  <div className="skeleton w-1/2 h-3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="card p-20 text-center"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="w-24 h-24 bg-nimbus-100 rounded-3xl flex items-center justify-center mx-auto mb-6"
            >
              <Cloud className="w-12 h-12 text-nimbus-500" strokeWidth={1.5} />
            </motion.div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              {search ? 'Nessun risultato' : 'Nessun file'}
            </h3>
            <p className="text-gray-400">
              {search ? `Nessun file corrisponde a "${search}"` : 'Carica il tuo primo file dalla sezione "Carica file"'}
            </p>
          </motion.div>
        )}

        {/* Grid View */}
        {!loading && filtered.length > 0 && viewMode === 'grid' && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4"
          >
            {filtered.map((file) => {
              const { Icon, color, bg, border } = getIconConfig(file.mimeType)
              const isImage = file.mimeType.startsWith('image/')
              return (
                <motion.div
                  key={file.id}
                  variants={itemVariants}
                  whileHover={{ y: -3, transition: { duration: 0.2 } }}
                  className="card group cursor-pointer overflow-hidden"
                  onClick={() => setViewerFile(file)}
                >
                  {/* Preview area */}
                  <div className={`relative ${bg} ${border} border-b aspect-[4/3] flex items-center justify-center overflow-hidden`}>
                    {isImage ? (
                      <img
                        src={`/api/files/${file.id}/stream`}
                        alt={file.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                    ) : (
                      <Icon className={`w-10 h-10 ${color}`} strokeWidth={1.5} />
                    )}

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-gray-900/0 group-hover:bg-gray-900/30 transition-all duration-300 flex items-center justify-center gap-3">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileHover={{ opacity: 1, scale: 1 }}
                        className="opacity-0 group-hover:opacity-100 transition-all duration-200 flex gap-2"
                      >
                        <button
                          onClick={e => { e.stopPropagation(); setViewerFile(file) }}
                          className="p-2.5 bg-white/90 hover:bg-white rounded-xl shadow-lg transition-all duration-150"
                          title="Apri nel browser"
                        >
                          <Eye className="w-4 h-4 text-nimbus-700" />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); handleDownload(file) }}
                          className="p-2.5 bg-white/90 hover:bg-white rounded-xl shadow-lg transition-all duration-150"
                          title="Scarica"
                        >
                          {downloading === file.id
                            ? <RefreshCw className="w-4 h-4 text-nimbus-700 animate-spin" />
                            : <Download className="w-4 h-4 text-nimbus-700" />
                          }
                        </button>
                      </motion.div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <p className="text-sm font-semibold text-gray-800 truncate mb-1" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}

        {/* List View */}
        {!loading && filtered.length > 0 && viewMode === 'list' && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="card overflow-hidden"
          >
            {filtered.map((file, idx) => {
              const { Icon, color, bg } = getIconConfig(file.mimeType)
              return (
                <motion.div
                  key={file.id}
                  variants={itemVariants}
                  className={`flex items-center gap-4 px-5 py-4 cursor-pointer
                             hover:bg-nimbus-50/50 transition-colors duration-150
                             ${idx > 0 ? 'border-t border-gray-50' : ''}`}
                  onClick={() => setViewerFile(file)}
                >
                  <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{file.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <HardDrive className="w-3 h-3" />
                        {formatFileSize(file.size)}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Calendar className="w-3 h-3" />
                        {formatDate(file.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={e => { e.stopPropagation(); setViewerFile(file) }}
                      className="btn-icon"
                      title="Apri"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); handleDownload(file) }}
                      className="btn-icon"
                      title="Scarica"
                    >
                      {downloading === file.id
                        ? <RefreshCw className="w-4 h-4 animate-spin" />
                        : <Download className="w-4 h-4" />
                      }
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </main>
      <Footer />
      <DeveloperChat />
    </div>
  )
}
