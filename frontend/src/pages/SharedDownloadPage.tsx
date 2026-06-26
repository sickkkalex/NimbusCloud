import { motion } from 'framer-motion'
import { useParams } from 'react-router-dom'
import { Cloud, Download, AlertTriangle, FileIcon, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import Footer from '../components/Footer'

export default function SharedDownloadPage() {
  const { token } = useParams<{ token: string }>()
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'expired' | 'notfound'>('idle')
  const downloadUrl = `/api/shares/download/${token}`

  useEffect(() => {
    // We don't pre-fetch metadata — just check if URL is present
    if (token) setStatus('ready')
    else setStatus('notfound')
  }, [token])

  const handleDownload = () => {
    setStatus('loading')
    // Navigate to download URL — browser handles it
    window.location.href = downloadUrl
    setTimeout(() => setStatus('ready'), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-nimbus-50 via-white to-nimbus-50 flex flex-col">
      {/* Header */}
      <header className="px-8 py-5 flex items-center gap-2.5">
        <img src="/logo.png" alt="NimbusCloud Logo" className="w-9 h-9 object-contain" />
        <span className="text-xl font-bold text-gray-900">
          Nimbus<span className="text-gradient">Cloud</span>
        </span>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="card max-w-md w-full p-10 text-center"
        >
          {status === 'notfound' ? (
            <>
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Link non valido</h2>
              <p className="text-gray-500 text-sm">Il link di condivisione è inesistente o già scaduto.</p>
            </>
          ) : (
            <>
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                className="w-20 h-20 bg-nimbus-100 rounded-3xl flex items-center justify-center mx-auto mb-6"
              >
                <FileIcon className="w-10 h-10 text-nimbus-600" strokeWidth={1.5} />
              </motion.div>

              <div className="badge badge-green mx-auto mb-4">
                <img src="/logo.png" alt="" className="w-3 h-3 object-contain" />
                <span>Condiviso tramite NimbusCloud</span>
              </div>

              <h2 className="text-xl font-bold text-gray-900 mb-2">File condiviso</h2>
              <p className="text-gray-400 text-sm mb-8">
                Hai ricevuto un file condiviso. Clicca il pulsante per scaricarlo.
              </p>

              <motion.button
                id="download-shared-btn"
                onClick={handleDownload}
                disabled={status === 'loading'}
                whileTap={{ scale: 0.97 }}
                className="btn-primary w-full"
              >
                {status === 'loading' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    <span>Scarica file</span>
                  </>
                )}
              </motion.button>

              <p className="text-xs text-gray-300 mt-4">
                Il link potrebbe scadere — scarica il file al più presto.
              </p>
            </>
          )}
        </motion.div>
      </main>

      <Footer />
    </div>
  )
}
