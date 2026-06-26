import apiClient from './client'

export interface UserProfile {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  dateOfBirth: string | null
  hasAvatar: boolean
}

export const getProfile = async (): Promise<UserProfile> => {
  const { data } = await apiClient.get<UserProfile>('/users/me')
  return data
}

export const updateProfile = async (payload: {
  firstName?: string
  lastName?: string
  dateOfBirth?: string | null
}): Promise<UserProfile> => {
  const { data } = await apiClient.patch<UserProfile>('/users/me', payload)
  return data
}

export const uploadAvatar = async (file: File): Promise<UserProfile> => {
  const formData = new FormData()
  formData.append('avatar', file)
  const { data } = await apiClient.post<UserProfile>('/users/me/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export const getAvatarUrl = (): string => {
  const token = localStorage.getItem('nimbus_token')
  return `/api/users/me/avatar?token=${token}&t=${Date.now()}`
}
