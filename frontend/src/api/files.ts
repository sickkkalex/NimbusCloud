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

export const uploadFile = async (
  file: File,
  folderId?: string | null,
  onProgress?: (percent: number) => void
): Promise<{ message: string; file: CloudFile }> => {
  const formData = new FormData()
  formData.append('file', file)
  if (folderId) formData.append('folderId', folderId)

  const { data } = await apiClient.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (event) => {
      if (onProgress && event.total) {
        onProgress(Math.round((event.loaded * 100) / event.total))
      }
    },
  })
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

export const streamFileUrl = (id: string): string => `/api/files/${id}/stream`

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
