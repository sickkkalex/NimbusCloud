import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState, useCallback } from 'react'
import {
  X, Download, ZoomIn, ZoomOut, RotateCw,
  ChevronLeft, ChevronRight, Maximize2, FileText,
} from 'lucide-react'
import { type CloudFile, downloadFile, formatFileSize } from '../api/files'

interface FileViewerProps {
  file: CloudFile | null
  files?: CloudFile[]
  onClose: () => void
  onNavigate?: (file: CloudFile) => void
}

export default function FileViewer({ file, files = [], onClose, onNavigate }: FileViewerProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [textContent, setTextContent] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [downloading, setDownloading] = useState(false)

  const currentIndex = files.findIndex(f => f.id === file?.id)

  const fetchFile = useCallback(async (f: CloudFile) => {
    setBlobUrl(null)
    setTextContent(null)
    setLoading(true)
    setZoom(1)
    setRotation(0)

    try {
      const token = localStorage.getItem('nimbus_token')
      const response = await fetch(`/api/files/${f.id}/stream`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error('Stream failed')

      const blob = await response.blob()

      if (f.mimeType.startsWith('text/') || f.mimeType.includes('json')) {
        const text = await blob.text()
        setTextContent(text)
      } else {
        const url = URL.createObjectURL(blob)
        setBlobUrl(url)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (file) fetchFile(file)
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl)
    }
  }, [file]) // eslint-disable-line

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && currentIndex > 0 && onNavigate)
        onNavigate(files[currentIndex - 1])
      if (e.key === 'ArrowRight' && currentIndex < files.length - 1 && onNavigate)
        onNavigate(files[currentIndex + 1])
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose, currentIndex, files, onNavigate])

  const handleDownload = async () => {
    if (!file) return
    setDownloading(true)
    try { await downloadFile(file.id, file.name) }
    finally { setDownloading(false) }
  }

  const renderContent = () => {
    if (loading) return (
      <div className="flex items-center justify-center h-full">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-3 border-nimbus-300 border-t-nimbus-600 rounded-full"
          style={{ borderWidth: 3 }}
        />
      </div>
    )

    if (!file) return null

    if (file.mimeType.startsWith('image/') && blobUrl) {
      return (
        <div className="flex items-center justify-center h-full overflow-hidden">
          <motion.img
            src={blobUrl}
            alt={file.name}
            style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
            className="max-w-full max-h-full object-contain transition-transform duration-200"
            draggable={false}
          />
        </div>
      )
    }

    if (file.mimeType.startsWith('video/') && blobUrl) {
      return (
        <div className="flex items-center justify-center h-full">
          <video
            src={blobUrl}
            controls
            className="max-w-full max-h-full rounded-xl"
            autoPlay={false}
          />
        </div>
      )
    }

    if (file.mimeType.startsWith('audio/') && blobUrl) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-8">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-32 h-32 bg-gradient-to-br from-nimbus-400 to-nimbus-700 rounded-3xl
                       flex items-center justify-center shadow-green-lg"
          >
            <span className="text-5xl">🎵</span>
          </motion.div>
          <p className="text-white font-semibold text-lg">{file.name}</p>
          <audio src={blobUrl} controls className="w-80" />
        </div>
      )
    }

    if (file.mimeType.includes('pdf') && blobUrl) {
      return (
        <iframe
          src={blobUrl}
          className="w-full h-full rounded-xl"
          title={file.name}
        />
      )
    }

    if (textContent !== null) {
      return (
        <div className="w-full h-full overflow-auto p-6">
          <pre className="text-gray-200 text-sm font-mono whitespace-pre-wrap break-words leading-relaxed">
            {textContent}
          </pre>
        </div>
      )
    }

    // Unsupported format
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6">
        <div className="w-24 h-24 bg-white/10 rounded-3xl flex items-center justify-center">
          <FileText className="w-12 h-12 text-white/60" strokeWidth={1.5} />
        </div>
        <div className="text-center">
          <p className="text-white font-semibold text-lg mb-1">{file.name}</p>
          <p className="text-white/50 text-sm">Anteprima non disponibile per questo tipo di file</p>
        </div>
        <button onClick={handleDownload} className="btn-primary">
          <Download className="w-4 h-4" />
          Scarica file
        </button>
      </div>
    )
  }

  return (
    <AnimatePresence>
      {file && (
        <motion.div
          key="viewer-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] bg-gray-950/95 backdrop-blur-sm flex flex-col"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          {/* Top bar */}
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.25, delay: 0.05 }}
            className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0"
          >
            <div className="flex items-center gap-3 min-w-0">
              <button onClick={onClose} className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all flex-shrink-0">
                <X className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <p className="text-white font-semibold truncate">{file.name}</p>
                <p className="text-white/40 text-xs">{formatFileSize(file.size)} · {file.mimeType}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Image controls */}
              {file.mimeType.startsWith('image/') && (
                <>
                  <button onClick={() => setZoom(z => Math.max(0.2, z - 0.2))} className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all">
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-white/40 text-xs w-10 text-center">{Math.round(zoom * 100)}%</span>
                  <button onClick={() => setZoom(z => Math.min(5, z + 0.2))} className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all">
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button onClick={() => setRotation(r => r + 90)} className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all">
                    <RotateCw className="w-4 h-4" />
                  </button>
                  <div className="w-px h-6 bg-white/10" />
                </>
              )}

              <button onClick={() => setZoom(1)} className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all hidden sm:flex">
                <Maximize2 className="w-4 h-4" />
              </button>

              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex items-center gap-2 px-4 py-2 bg-nimbus-500 hover:bg-nimbus-600 text-white text-sm font-semibold rounded-xl transition-all duration-200"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:block">{downloading ? 'Download...' : 'Scarica'}</span>
              </button>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, delay: 0.1 }}
            className="flex-1 overflow-hidden relative p-4"
          >
            {renderContent()}
          </motion.div>

          {/* Navigation arrows */}
          {files.length > 1 && onNavigate && (
            <>
              {currentIndex > 0 && (
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => onNavigate(files[currentIndex - 1])}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20
                             backdrop-blur-sm text-white rounded-full transition-all duration-200 z-10"
                >
                  <ChevronLeft className="w-6 h-6" />
                </motion.button>
              )}
              {currentIndex < files.length - 1 && (
                <motion.button
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => onNavigate(files[currentIndex + 1])}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20
                             backdrop-blur-sm text-white rounded-full transition-all duration-200 z-10"
                >
                  <ChevronRight className="w-6 h-6" />
                </motion.button>
              )}

              {/* Bottom counter */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/40 backdrop-blur-sm rounded-full z-10">
                <span className="text-white/70 text-xs">{currentIndex + 1} / {files.length}</span>
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
