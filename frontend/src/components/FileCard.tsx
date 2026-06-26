import { motion } from 'framer-motion'
import { useState } from 'react'
import {
  FileText, Image, Film, Music, Archive, Code, Sheet,
  Share2, Copy, Check, Calendar, HardDrive, MoreVertical,
} from 'lucide-react'
import { type CloudFile, createShare, formatFileSize } from '../api/files'

interface FileCardProps {
  file: CloudFile
  index: number
}

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return { Icon: Image, color: 'text-violet-500', bg: 'bg-violet-100' }
  if (mimeType.startsWith('video/')) return { Icon: Film, color: 'text-blue-500', bg: 'bg-blue-100' }
  if (mimeType.startsWith('audio/')) return { Icon: Music, color: 'text-pink-500', bg: 'bg-pink-100' }
  if (mimeType.includes('pdf')) return { Icon: FileText, color: 'text-red-500', bg: 'bg-red-100' }
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar'))
    return { Icon: Archive, color: 'text-amber-500', bg: 'bg-amber-100' }
  if (mimeType.includes('javascript') || mimeType.includes('json') || mimeType.includes('html') || mimeType.includes('css'))
    return { Icon: Code, color: 'text-cyan-500', bg: 'bg-cyan-100' }
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv'))
    return { Icon: Sheet, color: 'text-nimbus-600', bg: 'bg-nimbus-100' }
  return { Icon: FileText, color: 'text-gray-500', bg: 'bg-gray-100' }
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function FileCard({ file, index }: FileCardProps) {
  const { Icon, color, bg } = getFileIcon(file.mimeType)
  const [sharing, setSharing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const handleShare = async () => {
    setSharing(true)
    try {
      const { shareUrl } = await createShare(file.id, 7)
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch (err) {
      console.error('Share error:', err)
    } finally {
      setSharing(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: 'easeOut' }}
      whileHover={{ y: -2 }}
      className="card p-5 group relative"
    >
      {/* File type icon */}
      <div className={`w-12 h-12 ${bg} rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-105`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>

      {/* File name */}
      <h3 className="text-sm font-semibold text-gray-800 mb-1 truncate pr-6" title={file.name}>
        {file.name}
      </h3>

      {/* Metadata */}
      <div className="flex flex-col gap-1 mb-4">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <HardDrive className="w-3 h-3" />
          <span>{formatFileSize(file.size)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Calendar className="w-3 h-3" />
          <span>{formatDate(file.createdAt)}</span>
        </div>
      </div>

      {/* Actions */}
      <motion.button
        id={`share-btn-${file.id}`}
        onClick={handleShare}
        disabled={sharing}
        whileTap={{ scale: 0.95 }}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
          ${copied
            ? 'bg-nimbus-500 text-white'
            : 'bg-nimbus-50 text-nimbus-700 hover:bg-nimbus-100'
          } disabled:opacity-50`}
      >
        {copied ? (
          <>
            <Check className="w-4 h-4" />
            <span>Link copiato!</span>
          </>
        ) : (
          <>
            <Share2 className={`w-4 h-4 ${sharing ? 'animate-spin' : ''}`} />
            <span>{sharing ? 'Generando...' : 'Condividi'}</span>
          </>
        )}
      </motion.button>

      {/* More options button */}
      <div className="absolute top-3 right-3">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-gray-100 transition-all duration-200"
        >
          <MoreVertical className="w-4 h-4 text-gray-400" />
        </button>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-card-hover border border-gray-100 overflow-hidden z-10"
          >
            <button
              onClick={() => { handleShare(); setMenuOpen(false) }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Copy className="w-3.5 h-3.5" />
              Copia link
            </button>
          </motion.div>
        )}
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-[5]" onClick={() => setMenuOpen(false)} />
      )}
    </motion.div>
  )
}
