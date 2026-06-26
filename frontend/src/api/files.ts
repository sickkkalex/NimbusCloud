import apiClient from './client'

export interface CloudFile {
  id: string
  name: string
  systemPath: string
  size: number
  mimeType: string
  ownerId: string
  folderId: string | null
  folder?: { id: string; name: string } | null
  createdAt: string
  isDeleted?: boolean
  isStarred?: boolean
  deletedAt?: string | null
  thumbnailPath?: string | null
}

export interface ShareResponse {
  message: string
  shareUrl: string
  expiresAt: string | null
}

export const listFiles = async (): Promise<CloudFile[]> => {
  const { data } = await apiClient.get<CloudFile[]>('/files/list')
  return data
}

const CHUNK_SIZE = 2 * 1024 * 1024 // 2MB per chunk per maggiore stabilità

export const uploadFile = async (
  file: File,
  folderId?: string | null,
  onProgress?: (percent: number) => void
): Promise<{ message: string; file: CloudFile }> => {
  const uploadId = `${file.name}-${Date.now()}-${Math.random().toString(36).substring(7)}`
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE)

  if (totalChunks === 0) {
    // File vuoto
    throw new Error('File vuoto non supportato')
  }

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE
    const end = Math.min(start + CHUNK_SIZE, file.size)
    const chunk = file.slice(start, end)

    const formData = new FormData()
    formData.append('chunk', chunk)
    formData.append('uploadId', uploadId)
    formData.append('chunkIndex', String(i))

    await apiClient.post('/files/upload/chunk', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event) => {
        if (onProgress && event.total) {
          const chunkProgress = event.loaded / event.total
          const overallProgress = Math.round(((i + chunkProgress) / totalChunks) * 100)
          onProgress(overallProgress)
        }
      },
    })
  }

  // Completa upload
  const { data } = await apiClient.post('/files/upload/complete', {
    uploadId,
    filename: file.name,
    mimeType: file.type,
    size: file.size,
    totalChunks,
    folderId
  })

  if (onProgress) onProgress(100)
  return data
}

export const updateFile = async (
  id: string,
  payload: { name?: string; folderId?: string | null }
): Promise<{ file: CloudFile }> => {
  const { data } = await apiClient.patch(`/files/${id}`, payload)
  return data
}

export const deleteFile = async (id: string): Promise<void> => {
  await apiClient.delete(`/files/${id}`)
}

export const hardDeleteFile = async (id: string): Promise<void> => {
  await apiClient.delete(`/files/${id}/permanent`)
}

export const restoreFile = async (id: string): Promise<void> => {
  await apiClient.post(`/files/${id}/restore`)
}

export const toggleStarFile = async (id: string): Promise<{ file: CloudFile }> => {
  const { data } = await apiClient.post(`/files/${id}/star`)
  return data
}

export const streamFileUrl = (id: string): string => `/api/files/${id}/stream`
export const getThumbnailUrl = (id: string): string => `/api/files/${id}/thumbnail`

export const downloadFile = async (id: string, filename: string): Promise<void> => {
  const token = localStorage.getItem('nimbus_token')
  const response = await fetch(`/api/files/${id}/download`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) throw new Error('Download fallito')
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export const createShare = async (
  fileId: string,
  expiresInDays?: number
): Promise<ShareResponse> => {
  const { data } = await apiClient.post<ShareResponse>('/shares/create', {
    fileId,
    permission: 'READ',
    expiresInDays,
  })
  return data
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export const getFileCategory = (mimeType: string): 'image' | 'video' | 'audio' | 'document' | 'other' => {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'audio'
  if (
    mimeType.includes('pdf') ||
    mimeType.includes('document') ||
    mimeType.includes('text') ||
    mimeType.includes('sheet') ||
    mimeType.includes('presentation')
  ) return 'document'
  return 'other'
}
