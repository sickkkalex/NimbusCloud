import apiClient from './client'
import { CloudFile } from './files'
import { CloudFolder } from './folders'

export interface SearchResult {
  files: CloudFile[]
  folders: CloudFolder[]
}

export interface StorageStats {
  storageQuota: string
  totalUsed: number
  details: {
    images: number
    videos: number
    documents: number
    other: number
  }
}

export const getTrash = async (): Promise<SearchResult> => {
  const { data } = await apiClient.get<SearchResult>('/search/trash')
  return data
}

export const getStarred = async (): Promise<SearchResult> => {
  const { data } = await apiClient.get<SearchResult>('/search/starred')
  return data
}

export const globalSearch = async (query: string): Promise<SearchResult> => {
  const { data } = await apiClient.get<SearchResult>(`/search/query?q=${encodeURIComponent(query)}`)
  return data
}

export const getStorageStats = async (): Promise<StorageStats> => {
  const { data } = await apiClient.get<StorageStats>('/search/stats')
  return data
}
