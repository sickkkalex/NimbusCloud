import { motion, AnimatePresence } from 'framer-motion'
import { useState, useCallback } from 'react'
import {
  Image, Film, Music, FileText, FolderOpen, Upload, CheckCircle,
  AlertCircle, X, FileIcon, RefreshCw, Sparkles,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import { uploadFile, formatFileSize, type CloudFile } from '../api/files'

const CATEGORIES = [
  {
    key: 'photo',
    label: 'Foto',
    description: 'JPG, PNG, WebP, GIF, SVG',
    icon: Image,
    accept: 'image/*',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    activeBorder: 'border-violet-500',
    activeGlow: 'shadow-[0_0_0_4px_rgba(139,92,246,0.15)]',
    dragBg: 'bg-violet-50',
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    key: 'video',
    label: 'Video',
    description: 'MP4, MOV, AVI, MKV, WebM',
    icon: Film,
    accept: 'video/*',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    activeBorder: 'border-blue-500',
    activeGlow: 'shadow-[0_0_0_4px_rgba(59,130,246,0.15)]',
    dragBg: 'bg-blue-50',
    gradient: 'from-blue-500 to-cyan-600',
  },
  {
    key: 'document',
    label: 'Documenti',
    description: 'PDF, DOC, XLS, TXT, CSV',
    icon: FileText,
    accept: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.odt,.ods',
    color: 'text-nimbus-600',
    bg: 'bg-nimbus-50',
    border: 'border-nimbus-200',
    activeBorder: 'border-nimbus-500',
    activeGlow: 'shadow-[0_0_0_4px_rgba(34,197,94,0.15)]',
    dragBg: 'bg-nimbus-50',
    gradient: 'from-nimbus-500 to-green-600',
  },
  {
    key: 'other',
    label: 'Altro',
    description: 'Qualsiasi tipo di file',
    icon: FolderOpen,
    accept: '*/*',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    activeBorder: 'border-amber-500',
    activeGlow: 'shadow-[0_0_0_4px_rgba(245,158,11,0.15)]',
    dragBg: 'bg-amber-50',
    gradient: 'from-amber-500 to-orange-600',
  },
]

interface UploadItem {
  id: string
  file: File
  progress: number
  status: 'uploading' | 'success' | 'error'
  error?: string
  result?: CloudFile
}

export default function UploadPage() {
  const [activeTab, setActiveTab] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [uploads, setUploads] = useState<UploadItem[]>([])

  const cat = CATEGORIES[activeTab]

  const handleFiles = useCallback(async (files: File[]) => {
    const items: UploadItem[] = files.map(f => ({
      id: `${f.name}-${Date.now()}-${Math.random()}`,
      file: f,
      progress: 0,
      status: 'uploading',
    }))

    setUploads(prev => [...items, ...prev])

    await Promise.all(items.map(async item => {
      try {
        const result = await uploadFile(item.file, null, (pct) => {
          setUploads(prev =>
            prev.map(u => u.id === item.id ? { ...u, progress: pct } : u)
          )
        })
        setUploads(prev =>
          prev.map(u =>
            u.id === item.id ? { ...u, status: 'success', progress: 100, result: result.file } : u
          )
        )
      } catch (err: unknown) {
        const msg = (err && typeof err === 'object' && 'response' in err)
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Errore'
          : 'Errore durante il caricamento'
        setUploads(prev =>
          prev.map(u => u.id === item.id ? { ...u, status: 'error', error: msg } : u)
        )
      }
    }))
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length) handleFiles(files)
  }, [handleFiles])

  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length) handleFiles(files)
    e.target.value = ''
  }

  const clearCompleted = () => {
    setUploads(prev => prev.filter(u => u.status === 'uploading'))
  }

  const successCount = uploads.filter(u => u.status === 'success').length
  const errorCount = uploads.filter(u => u.status === 'error').length

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #f8fffe 50%, #f0fdf4 100%)' }}>
      <Navbar />

      <main className="max-w-[1440px] mx-auto px-6 lg:px-10 py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-nimbus-500 to-nimbus-700 rounded-2xl flex items-center justify-center shadow-green-sm">
              <Upload className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
              Carica <span className="text-gradient">file</span>
            </h1>
          </div>
          <p className="text-gray-500 text-lg ml-[52px]">
            Seleziona la categoria e trascina i file per iniziare
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
          {/* Left: Upload area */}
          <div>
            {/* Category tabs */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6"
            >
              {CATEGORIES.map((c, i) => (
                <motion.button
                  key={c.key}
                  onClick={() => setActiveTab(i)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 text-center
                             transition-all duration-250
                             ${activeTab === i
                               ? `${c.border} ${c.activeBorder} ${c.bg} ${c.activeGlow}`
                               : 'border-gray-100 bg-white hover:border-gray-200 shadow-sm'
                             }`}
                >
                  {activeTab === i && (
                    <motion.div
                      layoutId="category-bg"
                      className={`absolute inset-0 rounded-2xl ${c.bg} opacity-60`}
                      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                    />
                  )}
                  <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center
                                  ${activeTab === i ? `bg-gradient-to-br ${c.gradient} shadow-md` : 'bg-gray-100'}`}>
                    <c.icon className={`w-5 h-5 ${activeTab === i ? 'text-white' : 'text-gray-400'}`} />
                  </div>
                  <div className="relative">
                    <p className={`text-sm font-semibold ${activeTab === i ? c.color : 'text-gray-700'}`}>{c.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">{c.description}</p>
                  </div>
                </motion.button>
              ))}
            </motion.div>

            {/* Drop zone */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                className={`relative rounded-3xl border-2 border-dashed transition-all duration-300 cursor-pointer
                           ${dragging
                             ? `${cat.activeBorder} ${cat.bg} scale-[1.01] ${cat.activeGlow}`
                             : `${cat.border} hover:${cat.activeBorder} bg-white`
                           }`}
              >
                <label htmlFor="file-input" className="block p-14 text-center cursor-pointer">
                  <motion.div
                    animate={dragging ? { scale: 1.15, y: -8 } : { scale: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className={`mx-auto w-20 h-20 rounded-3xl flex items-center justify-center mb-6
                               bg-gradient-to-br ${cat.gradient} shadow-lg`}
                  >
                    <cat.icon className="w-10 h-10 text-white" strokeWidth={1.5} />
                  </motion.div>

                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {dragging ? 'Rilascia qui! 🎯' : `Carica ${cat.label}`}
                  </h3>
                  <p className="text-gray-500 mb-1">
                    Trascina e rilascia oppure{' '}
                    <span className={`font-semibold ${cat.color}`}>clicca per selezionare</span>
                  </p>
                  <p className="text-sm text-gray-400">{cat.description} • fino a 500MB</p>
                </label>
                <input
                  id="file-input"
                  type="file"
                  multiple
                  accept={cat.accept}
                  onChange={onInput}
                  className="sr-only"
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right: Upload queue */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* Stats bar */}
            {(successCount > 0 || errorCount > 0) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 mb-4"
              >
                {successCount > 0 && (
                  <span className="badge-green flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" />
                    {successCount} caricati
                  </span>
                )}
                {errorCount > 0 && (
                  <span className="badge-red">{errorCount} errori</span>
                )}
                <button onClick={clearCompleted} className="ml-auto btn-ghost text-xs py-1">
                  Pulisci
                </button>
              </motion.div>
            )}

            {/* Empty state */}
            {uploads.length === 0 && (
              <div className="card p-10 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-gray-300" strokeWidth={1.5} />
                </div>
                <p className="text-gray-400 text-sm">La coda di caricamento è vuota</p>
              </div>
            )}

            {/* Upload items */}
            <div className="space-y-3 max-h-[600px] overflow-y-auto scrollbar-hide">
              <AnimatePresence>
                {uploads.map(item => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 20, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: 'auto' }}
                    exit={{ opacity: 0, x: 20, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="card p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                                      ${item.status === 'success' ? 'bg-nimbus-100'
                                        : item.status === 'error' ? 'bg-red-50' : 'bg-gray-100'}`}>
                        <FileIcon className={`w-5 h-5 
                          ${item.status === 'success' ? 'text-nimbus-600'
                            : item.status === 'error' ? 'text-red-400' : 'text-gray-400'}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-sm font-semibold text-gray-800 truncate pr-2">{item.file.name}</p>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className="text-xs text-gray-400">{formatFileSize(item.file.size)}</span>
                            {item.status === 'success' && <CheckCircle className="w-4 h-4 text-nimbus-500" />}
                            {item.status === 'error' && <AlertCircle className="w-4 h-4 text-red-400" />}
                            {item.status === 'uploading' && (
                              <RefreshCw className="w-3.5 h-3.5 text-nimbus-500 animate-spin" />
                            )}
                          </div>
                        </div>

                        {item.status === 'uploading' && (
                          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <motion.div
                              className={`h-full rounded-full bg-gradient-to-r ${cat.gradient}`}
                              initial={{ width: '0%' }}
                              animate={{ width: `${item.progress}%` }}
                              transition={{ duration: 0.3, ease: 'easeOut' }}
                            />
                          </div>
                        )}
                        {item.status === 'success' && (
                          <p className="text-xs text-nimbus-600 font-medium">✓ Caricato con successo</p>
                        )}
                        {item.status === 'error' && (
                          <p className="text-xs text-red-500">{item.error}</p>
                        )}
                      </div>

                      <button
                        onClick={() => setUploads(prev => prev.filter(u => u.id !== item.id))}
                        className="p-1 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                      >
                        <X className="w-4 h-4 text-gray-300" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
