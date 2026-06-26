import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Folder, FolderOpen, FolderPlus, File as FileIcon,
  Image, Film, Music, FileText, Archive, Code,
  MoreVertical, Pencil, Trash2, Download, Eye,
  Scissors, Copy, ClipboardPaste, RefreshCw, Check, X,
  ChevronRight, Home, Search,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import FileViewer from '../components/FileViewer'
import { listFiles, updateFile, deleteFile, downloadFile, formatFileSize, type CloudFile } from '../api/files'
import { listFolders, createFolder, renameFolder, deleteFolder, type CloudFolder } from '../api/folders'
import { useClipboardStore } from '../store/clipboardStore'

const getIcon = (mime: string) => {
  if (mime.startsWith('image/')) return { Icon: Image, color: 'text-violet-500', bg: 'bg-violet-50' }
  if (mime.startsWith('video/')) return { Icon: Film, color: 'text-blue-500', bg: 'bg-blue-50' }
  if (mime.startsWith('audio/')) return { Icon: Music, color: 'text-pink-500', bg: 'bg-pink-50' }
  if (mime.includes('pdf')) return { Icon: FileText, color: 'text-red-500', bg: 'bg-red-50' }
  if (mime.includes('zip') || mime.includes('rar')) return { Icon: Archive, color: 'text-amber-500', bg: 'bg-amber-50' }
  if (mime.includes('javascript') || mime.includes('json') || mime.includes('html')) return { Icon: Code, color: 'text-cyan-500', bg: 'bg-cyan-50' }
  return { Icon: FileIcon, color: 'text-gray-500', bg: 'bg-gray-50' }
}

interface CtxMenu { x: number; y: number; file?: CloudFile; folder?: CloudFolder }

export default function FilesPage() {
  const [files, setFiles] = useState<CloudFile[]>([])
  const [folders, setFolders] = useState<CloudFolder[]>([])
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [viewerFile, setViewerFile] = useState<CloudFile | null>(null)
  const [ctxMenu, setCtxMenu] = useState<CtxMenu | null>(null)
  const [renaming, setRenaming] = useState<{ id: string; type: 'file' | 'folder'; name: string } | null>(null)
  const [newFolderMode, setNewFolderMode] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [downloading, setDownloading] = useState<string | null>(null)
  const { items: clipboard, operation: clipOp, copy: cbCopy, cut: cbCut, clear: cbClear } = useClipboardStore()
  const renameRef = useRef<HTMLInputElement>(null)
  const newFolderRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const [f, fo] = await Promise.all([listFiles(), listFolders()])
    setFiles(f); setFolders(fo); setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => { if (renaming) renameRef.current?.focus() }, [renaming])
  useEffect(() => { if (newFolderMode) newFolderRef.current?.focus() }, [newFolderMode])

  useEffect(() => {
    const hide = () => setCtxMenu(null)
    window.addEventListener('click', hide)
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') hide() })
    return () => window.removeEventListener('click', hide)
  }, [])

  const currentFolderFiles = files.filter(f =>
    f.folderId === currentFolderId &&
    f.name.toLowerCase().includes(search.toLowerCase())
  )

  const currentFolderFolders = folders.filter(f =>
    f.parentId === currentFolderId &&
    f.name.toLowerCase().includes(search.toLowerCase())
  )

  const currentFolder = folders.find(f => f.id === currentFolderId)

  // Breadcrumb path
  const getBreadcrumb = () => {
    const crumbs: CloudFolder[] = []
    let id = currentFolderId
    while (id) {
      const f = folders.find(fo => fo.id === id)
      if (!f) break
      crumbs.unshift(f)
      id = f.parentId
    }
    return crumbs
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) { setNewFolderMode(false); return }
    await createFolder(newFolderName.trim(), currentFolderId ?? undefined)
    setNewFolderName(''); setNewFolderMode(false); load()
  }

  const handleRename = async () => {
    if (!renaming || !renaming.name.trim()) { setRenaming(null); return }
    if (renaming.type === 'file') await updateFile(renaming.id, { name: renaming.name })
    else await renameFolder(renaming.id, renaming.name)
    setRenaming(null); load()
  }

  const handleDelete = async (item: CloudFile | CloudFolder, type: 'file' | 'folder') => {
    if (!confirm(`Eliminare "${(item as CloudFile).name || (item as CloudFolder).name}"?`)) return
    if (type === 'file') await deleteFile(item.id)
    else await deleteFolder(item.id)
    load()
  }

  const handlePaste = async () => {
    if (!clipboard.length) return
    await Promise.all(clipboard.map(f => updateFile(f.id, { folderId: currentFolderId })))
    cbClear(); load()
  }

  const handleDownload = async (f: CloudFile) => {
    setDownloading(f.id); try { await downloadFile(f.id, f.name) } finally { setDownloading(null) }
  }

  const openCtx = (e: React.MouseEvent, file?: CloudFile, folder?: CloudFolder) => {
    e.preventDefault(); e.stopPropagation()
    setCtxMenu({ x: e.clientX, y: e.clientY, file, folder })
  }

  const rootFolders = folders.filter(f => f.parentId === null)

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg,#f0fdf4 0%,#f8fffe 50%,#f0fdf4 100%)' }}>
      <Navbar />
      <FileViewer file={viewerFile} files={currentFolderFiles} onClose={() => setViewerFile(null)} onNavigate={setViewerFile} />

      {/* Context Menu */}
      <AnimatePresence>
        {ctxMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.12 }}
            className="context-menu fixed"
            style={{ top: ctxMenu.y, left: ctxMenu.x }}
            onClick={e => e.stopPropagation()}
          >
            {ctxMenu.file && (
              <>
                <button className="context-menu-item" onClick={() => { setViewerFile(ctxMenu.file!); setCtxMenu(null) }}>
                  <Eye className="w-4 h-4 text-gray-400" /> Apri
                </button>
                <button className="context-menu-item" onClick={() => { handleDownload(ctxMenu.file!); setCtxMenu(null) }}>
                  <Download className="w-4 h-4 text-gray-400" /> Scarica
                </button>
                <div className="context-menu-separator" />
                <button className="context-menu-item" onClick={() => { cbCopy([ctxMenu.file!]); setCtxMenu(null) }}>
                  <Copy className="w-4 h-4 text-gray-400" /> Copia
                </button>
                <button className="context-menu-item" onClick={() => { cbCut([ctxMenu.file!]); setCtxMenu(null) }}>
                  <Scissors className="w-4 h-4 text-gray-400" /> Taglia
                </button>
                <div className="context-menu-separator" />
                <button className="context-menu-item" onClick={() => { setRenaming({ id: ctxMenu.file!.id, type: 'file', name: ctxMenu.file!.name }); setCtxMenu(null) }}>
                  <Pencil className="w-4 h-4 text-gray-400" /> Rinomina
                </button>
                <button className="context-menu-item-danger" onClick={() => { handleDelete(ctxMenu.file!, 'file'); setCtxMenu(null) }}>
                  <Trash2 className="w-4 h-4" /> Elimina
                </button>
              </>
            )}
            {ctxMenu.folder && (
              <>
                <button className="context-menu-item" onClick={() => { setCurrentFolderId(ctxMenu.folder!.id); setCtxMenu(null) }}>
                  <FolderOpen className="w-4 h-4 text-gray-400" /> Apri
                </button>
                <div className="context-menu-separator" />
                <button className="context-menu-item" onClick={() => { setRenaming({ id: ctxMenu.folder!.id, type: 'folder', name: ctxMenu.folder!.name }); setCtxMenu(null) }}>
                  <Pencil className="w-4 h-4 text-gray-400" /> Rinomina
                </button>
                <button className="context-menu-item-danger" onClick={() => { handleDelete(ctxMenu.folder!, 'folder'); setCtxMenu(null) }}>
                  <Trash2 className="w-4 h-4" /> Elimina
                </button>
              </>
            )}
            {!ctxMenu.file && !ctxMenu.folder && clipboard.length > 0 && (
              <button className="context-menu-item" onClick={() => { handlePaste(); setCtxMenu(null) }}>
                <ClipboardPaste className="w-4 h-4 text-gray-400" /> Incolla
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-10 py-4 sm:py-8 pb-24 md:pb-8 gap-6">
        {/* Sidebar */}
        <motion.aside
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="w-56 flex-shrink-0 hidden md:block"
        >
          <div className="card p-3 sticky top-24">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">Cartelle</p>

            <button
              onClick={() => setCurrentFolderId(null)}
              className={`sidebar-item w-full ${!currentFolderId ? 'sidebar-item-active' : ''}`}
            >
              <Home className="w-4 h-4" /> Root
            </button>

            {rootFolders.map(f => (
              <button
                key={f.id}
                onClick={() => setCurrentFolderId(f.id)}
                onContextMenu={e => openCtx(e, undefined, f)}
                className={`sidebar-item w-full ${currentFolderId === f.id ? 'sidebar-item-active' : ''}`}
              >
                <Folder className="w-4 h-4 text-amber-400" />
                <span className="truncate">{f.name}</span>
                <span className="ml-auto text-xs text-gray-300">{f._count?.files ?? 0}</span>
              </button>
            ))}

            <div className="mt-2 pt-2 border-t border-gray-50">
              {!newFolderMode ? (
                <button onClick={() => setNewFolderMode(true)} className="sidebar-item w-full text-nimbus-600">
                  <FolderPlus className="w-4 h-4" /> Nuova cartella
                </button>
              ) : (
                <div className="px-2 flex gap-1">
                  <input
                    ref={newFolderRef}
                    value={newFolderName}
                    onChange={e => setNewFolderName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleCreateFolder(); if (e.key === 'Escape') setNewFolderMode(false) }}
                    placeholder="Nome cartella"
                    className="input-sm flex-1 text-xs"
                  />
                  <button onClick={handleCreateFolder} className="p-1.5 bg-nimbus-500 text-white rounded-lg hover:bg-nimbus-600">
                    <Check className="w-3 h-3" />
                  </button>
                  <button onClick={() => setNewFolderMode(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                    <X className="w-3 h-3 text-gray-400" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {/* Breadcrumb + toolbar */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-wrap items-center gap-3 mb-6"
          >
            {/* Breadcrumb */}
            <div className="flex items-center gap-1 text-sm flex-1">
              <button onClick={() => setCurrentFolderId(null)} className="text-gray-400 hover:text-nimbus-600 transition-colors">
                <Home className="w-4 h-4" />
              </button>
              {getBreadcrumb().map(f => (
                <span key={f.id} className="flex items-center gap-1">
                  <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                  <button onClick={() => setCurrentFolderId(f.id)} className="text-gray-600 hover:text-nimbus-600 font-medium transition-colors">
                    {f.name}
                  </button>
                </span>
              ))}
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-2">
              {clipboard.length > 0 && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={handlePaste}
                  className="btn-secondary text-xs py-2"
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  Incolla ({clipboard.length})
                  {clipOp === 'cut' && <span className="badge-red ml-1">Taglia</span>}
                </motion.button>
              )}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca…" className="input-sm pl-9 w-32 sm:w-40" />
              </div>
              <button onClick={() => load()} className="btn-icon"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
            </div>
          </motion.div>

          {/* Content */}
          <div onContextMenu={e => { if ((e.target as HTMLElement).closest('[data-item]')) return; openCtx(e) }}>
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {[...Array(8)].map((_, i) => <div key={i} className="card p-5"><div className="skeleton w-12 h-12 mb-3" /><div className="skeleton w-3/4 h-4" /></div>)}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {currentFolderFolders.length === 0 && currentFolderFiles.length === 0 ? (
                  <div className="card p-16 text-center">
                    <FolderOpen className="w-14 h-14 text-gray-200 mx-auto mb-4" strokeWidth={1.5} />
                    <p className="text-gray-400 font-medium">Cartella vuota</p>
                    <p className="text-gray-300 text-sm mt-1">Trascina file qui o usa "Carica file"</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {/* Sub-folders */}
                    <AnimatePresence>
                      {currentFolderFolders.map((folder, i) => (
                        <motion.div
                          key={folder.id}
                          data-item="true"
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0, transition: { delay: i * 0.04 } }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          whileHover={{ y: -2 }}
                          onContextMenu={e => openCtx(e, undefined, folder)}
                          className="card p-4 cursor-pointer group"
                          onDoubleClick={() => setCurrentFolderId(folder.id)}
                        >
                          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                            <Folder className="w-7 h-7 text-amber-400" strokeWidth={1.5} />
                          </div>
                          {renaming?.id === folder.id ? (
                            <input
                              ref={renameRef}
                              value={renaming.name}
                              onChange={e => setRenaming({ ...renaming, name: e.target.value })}
                              onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setRenaming(null) }}
                              onBlur={handleRename}
                              className="input-sm text-xs w-full"
                              onClick={e => e.stopPropagation()}
                            />
                          ) : (
                            <p className="text-sm font-semibold text-gray-800 truncate">{folder.name}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-0.5">{folder._count?.files ?? 0} file</p>

                          <button
                            onClick={e => openCtx(e, undefined, folder)}
                            className="absolute top-2 right-2 p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-gray-100 transition-all"
                          >
                            <MoreVertical className="w-3.5 h-3.5 text-gray-400" />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {/* Files */}
                    <AnimatePresence>
                      {currentFolderFiles.map((file, i) => {
                        const { Icon, color, bg } = getIcon(file.mimeType)
                        const isCut = clipOp === 'cut' && clipboard.some(c => c.id === file.id)
                        return (
                          <motion.div
                            key={file.id}
                            data-item="true"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: isCut ? 0.4 : 1, y: 0, transition: { delay: (currentFolderFolders.length + i) * 0.04 } }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            whileHover={{ y: -2 }}
                            onContextMenu={e => openCtx(e, file)}
                            className="card p-4 cursor-pointer group relative"
                            onClick={() => setViewerFile(file)}
                          >
                            <div className={`w-12 h-12 ${bg} rounded-2xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
                              <Icon className={`w-6 h-6 ${color}`} strokeWidth={1.5} />
                            </div>

                            {renaming?.id === file.id ? (
                              <input
                                ref={renameRef}
                                value={renaming.name}
                                onChange={e => setRenaming({ ...renaming, name: e.target.value })}
                                onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setRenaming(null) }}
                                onBlur={handleRename}
                                className="input-sm text-xs w-full"
                                onClick={e => e.stopPropagation()}
                              />
                            ) : (
                              <p className="text-sm font-semibold text-gray-800 truncate" title={file.name}>{file.name}</p>
                            )}
                            <p className="text-xs text-gray-400 mt-0.5">{formatFileSize(file.size)}</p>

                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                              <button onClick={e => { e.stopPropagation(); handleDownload(file) }} className="p-1 rounded-lg hover:bg-gray-100">
                                {downloading === file.id
                                  ? <RefreshCw className="w-3.5 h-3.5 text-nimbus-500 animate-spin" />
                                  : <Download className="w-3.5 h-3.5 text-gray-400" />}
                              </button>
                              <button onClick={e => openCtx(e, file)} className="p-1 rounded-lg hover:bg-gray-100">
                                <MoreVertical className="w-3.5 h-3.5 text-gray-400" />
                              </button>
                            </div>
                          </motion.div>
                        )
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
