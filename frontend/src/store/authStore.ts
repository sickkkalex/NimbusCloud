import { create } from 'zustand'

export interface User {
  id: string
  email: string
  firstName?: string | null
  lastName?: string | null
  dateOfBirth?: string | null
  hasAvatar?: boolean
}

interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  isHydrated: boolean
  login: (token: string, user: User) => void
  logout: () => void
  loadFromStorage: () => void
  setHydrated: () => void
  updateUser: (user: Partial<User>) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isHydrated: false,

  login: (token: string, user: User) => {
    localStorage.setItem('nimbus_token', token)
    localStorage.setItem('nimbus_user', JSON.stringify(user))
    set({ token, user, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem('nimbus_token')
    localStorage.removeItem('nimbus_user')
    set({ token: null, user: null, isAuthenticated: false })
  },

  loadFromStorage: () => {
    const token = localStorage.getItem('nimbus_token')
    const userStr = localStorage.getItem('nimbus_user')
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User
        set({ token, user, isAuthenticated: true, isHydrated: true })
      } catch {
        localStorage.removeItem('nimbus_token')
        localStorage.removeItem('nimbus_user')
        set({ isHydrated: true })
      }
    } else {
      set({ isHydrated: true })
    }
  },

  setHydrated: () => set({ isHydrated: true }),

  updateUser: (partial: Partial<User>) =>
    set((state) => {
      if (!state.user) return state
      const user = { ...state.user, ...partial }
      localStorage.setItem('nimbus_user', JSON.stringify(user))
      return { user }
    }),
}))

export const getDisplayName = (user: User | null): string => {
  if (!user) return 'Utente'
  const full = [user.firstName, user.lastName].filter(Boolean).join(' ')
  return full || user.email.split('@')[0]
}

export const getInitials = (user: User | null): string => {
  if (!user) return 'NC'
  if (user.firstName || user.lastName) {
    return [user.firstName?.[0], user.lastName?.[0]].filter(Boolean).join('').toUpperCase() || 'NC'
  }
  return user.email.slice(0, 2).toUpperCase()
}
