import apiClient from './client'

export interface CloudFolder {
  id: string
  name: string
  ownerId: string
  parentId: string | null
  createdAt: string
  children?: CloudFolder[]
  _count?: { files: number }
  isDeleted?: boolean
  isStarred?: boolean
  deletedAt?: string | null
}

export const listFolders = async (): Promise<CloudFolder[]> => {
  const { data } = await apiClient.get<CloudFolder[]>('/folders')
  return data
}

export const createFolder = async (name: string, parentId?: string): Promise<{ folder: CloudFolder }> => {
  const { data } = await apiClient.post('/folders', { name, parentId: parentId || null })
  return data
}

export const renameFolder = async (id: string, name: string): Promise<{ folder: CloudFolder }> => {
  const { data } = await apiClient.patch(`/folders/${id}`, { name })
  return data
}

export const deleteFolder = async (id: string): Promise<void> => {
  await apiClient.delete(`/folders/${id}`)
}

export const hardDeleteFolder = async (id: string): Promise<void> => {
  await apiClient.delete(`/folders/${id}/permanent`)
}

export const restoreFolder = async (id: string): Promise<void> => {
  await apiClient.post(`/folders/${id}/restore`)
}

export const toggleStarFolder = async (id: string): Promise<{ folder: CloudFolder }> => {
  const { data } = await apiClient.post(`/folders/${id}/star`)
  return data
}

export const moveFolder = async (id: string, parentId: string | null): Promise<{ folder: CloudFolder }> => {
  const { data } = await apiClient.patch(`/folders/${id}`, { parentId })
  return data
}
