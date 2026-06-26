import apiClient from './client'

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  email: string
  password: string
}

export interface AuthResponse {
  token: string
  message: string
}

export interface RegisterResponse {
  message: string
  userId: string
}

export interface MessageResponse {
  message: string
}

export interface VerifyOtpResponse {
  message: string
  resetToken: string
}

export const login = async (payload: LoginPayload): Promise<AuthResponse> => {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', payload)
  return data
}

export const register = async (payload: RegisterPayload): Promise<RegisterResponse> => {
  const { data } = await apiClient.post<RegisterResponse>('/auth/register', payload)
  return data
}

export const forgotPassword = async (email: string): Promise<MessageResponse> => {
  const { data } = await apiClient.post<MessageResponse>('/auth/forgot-password', { email })
  return data
}

export const verifyOtp = async (email: string, otp: string): Promise<VerifyOtpResponse> => {
  const { data } = await apiClient.post<VerifyOtpResponse>('/auth/verify-otp', { email, otp })
  return data
}

export const resetPassword = async (payload: {
  email: string
  otp?: string
  resetToken?: string
  newPassword: string
}): Promise<MessageResponse> => {
  const { data } = await apiClient.post<MessageResponse>('/auth/reset-password', payload)
  return data
}
