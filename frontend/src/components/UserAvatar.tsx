import { useState } from 'react'
import { useAuthStore, getInitials } from '../store/authStore'
import { getAvatarUrl } from '../api/user'

interface UserAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-20 h-20 text-2xl',
  xl: 'w-24 h-24 text-3xl',
}

export default function UserAvatar({ size = 'md', className = '' }: UserAvatarProps) {
  const { user } = useAuthStore()
  const [imgError, setImgError] = useState(false)
  const initials = getInitials(user)
  const showImage = user?.hasAvatar && !imgError

  return (
    <div
      className={`${sizes[size]} bg-gradient-to-br from-nimbus-400 to-nimbus-700 rounded-full
                  flex items-center justify-center shadow-green-sm overflow-hidden flex-shrink-0 ${className}`}
    >
      {showImage ? (
        <img
          src={getAvatarUrl()}
          alt="Avatar"
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="font-bold text-white">{initials}</span>
      )}
    </div>
  )
}
