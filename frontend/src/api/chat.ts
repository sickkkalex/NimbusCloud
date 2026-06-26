import apiClient from './client'

export interface ChatMessage {
  id: string
  content: string
  isFromDev: boolean
  createdAt: string
}

export interface Conversation {
  userId: string
  email: string
  name: string
  lastMessage: string
  lastMessageAt: string | null
}

export const getMessages = async (): Promise<ChatMessage[]> => {
  const { data } = await apiClient.get<ChatMessage[]>('/chat/messages')
  return data
}

export const sendMessage = async (content: string, userId?: string): Promise<ChatMessage> => {
  const { data } = await apiClient.post<ChatMessage>('/chat/messages', { content, userId })
  return data
}

export const getConversations = async (): Promise<Conversation[]> => {
  const { data } = await apiClient.get<Conversation[]>('/chat/conversations')
  return data
}

export const getUserMessages = async (userId: string): Promise<ChatMessage[]> => {
  const { data } = await apiClient.get<ChatMessage[]>(`/chat/conversations/${userId}/messages`)
  return data
}
