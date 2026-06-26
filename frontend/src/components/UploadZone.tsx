import { motion, AnimatePresence } from 'framer-motion'
import { useCallback, useState } from 'react'
import { UploadCloud, X, CheckCircle, AlertCircle, FileIcon } from 'lucide-react'
import { uploadFile, formatFileSize, type CloudFile } from '../api/files'

interface UploadZoneProps {
  onUploadSuccess: (file: CloudFile) => void
}

interface UploadItem {
  file: File
  progress: number
  status: 'uploading' | 'success' | 'error'
  error?: string
}

export default function UploadZone({ onUploadSuccess }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploads, setUploads] = useState<UploadItem[]>([])

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files)

    fileArray.forEach(async (file) => {
      const uploadItem: UploadItem = { file, progress: 0, status: 'uploading' }
      setUploads((prev) => [...prev, uploadItem])

      try {
        const result = await uploadFile(file, null, (percent: number) => {
          setUploads((prev) =>
            prev.map((u) => (u.file === file ? { ...u, progress: percent } : u))
          )
        })

        setUploads((prev) =>
          prev.map((u) =>
            u.file === file ? { ...u, progress: 100, status: 'success' } : u
          )
        )

        onUploadSuccess(result.file)

        // Remove from list after success
        setTimeout(() => {
          setUploads((prev) => prev.filter((u) => u.file !== file))
        }, 3000)
      } catch (err: unknown) {
        const msg =
          err && typeof err === 'object' && 'response' in err
            ? ((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Errore durante il caricamento')
            : 'Errore durante il caricamento'
        setUploads((prev) =>
          prev.map((u) =>
            u.file === file ? { ...u, status: 'error', error: msg } : u
          )
        )
        setTimeout(() => {
          setUploads((prev) => prev.filter((u) => u.file !== file))
        }, 4000)
      }
    })
  }, [onUploadSuccess])

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragging(false)
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files)
      }
    },
    [handleFiles]
  )

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
      e.target.value = '' // reset
    }
  }

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`relative group rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer
          ${isDragging
            ? 'border-nimbus-500 bg-nimbus-50 scale-[1.01]'
            : 'border-gray-200 bg-gray-50/50 hover:border-nimbus-300 hover:bg-nimbus-50/50'
          }`}
      >
        <label htmlFor="file-upload-input" className="block p-10 text-center cursor-pointer">
          <motion.div
            animate={isDragging ? { scale: 1.1, y: -4 } : { scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300
              ${isDragging ? 'bg-nimbus-500 shadow-green-md' : 'bg-nimbus-100 group-hover:bg-nimbus-200'}`}
          >
            <UploadCloud
              className={`w-8 h-8 transition-colors duration-300
                ${isDragging ? 'text-white' : 'text-nimbus-500 group-hover:text-nimbus-600'}`}
            />
          </motion.div>

          <p className="text-base font-semibold text-gray-800 mb-1">
            {isDragging ? 'Rilascia qui i file' : 'Carica i tuoi file'}
          </p>
          <p className="text-sm text-gray-500">
            Trascina e rilascia oppure{' '}
            <span className="text-nimbus-600 font-medium hover:text-nimbus-700">
              clicca per selezionare
            </span>
          </p>
          <p className="text-xs text-gray-400 mt-2">Tutti i tipi di file — fino a 500MB</p>
        </label>

        <input
          id="file-upload-input"
          type="file"
          multiple
          onChange={onInputChange}
          className="sr-only"
        />
      </div>

      {/* Upload Progress Items */}
      <AnimatePresence>
        {uploads.map((upload, idx) => (
          <motion.div
            key={`${upload.file.name}-${idx}`}
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.25 }}
            className="card p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-nimbus-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <FileIcon className="w-5 h-5 text-nimbus-600" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-800 truncate">{upload.file.name}</p>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className="text-xs text-gray-400">{formatFileSize(upload.file.size)}</span>
                    {upload.status === 'uploading' && (
                      <span className="text-xs font-semibold text-nimbus-600">{upload.progress}%</span>
                    )}
                    {upload.status === 'success' && (
                      <CheckCircle className="w-4 h-4 text-nimbus-500" />
                    )}
                    {upload.status === 'error' && (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </div>

                {upload.status === 'uploading' && (
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-nimbus-400 to-nimbus-600 rounded-full"
                      initial={{ width: '0%' }}
                      animate={{ width: `${upload.progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                )}

                {upload.status === 'success' && (
                  <p className="text-xs text-nimbus-600 font-medium">Caricato con successo!</p>
                )}

                {upload.status === 'error' && (
                  <p className="text-xs text-red-500">{upload.error}</p>
                )}
              </div>

              <button
                onClick={() => setUploads((prev) => prev.filter((_, i) => i !== idx))}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
