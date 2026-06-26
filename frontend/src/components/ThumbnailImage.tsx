import { useState, useEffect } from 'react'
import { getThumbnailUrl } from '../api/files'
import { Image as ImageIcon } from 'lucide-react'

interface ThumbnailImageProps {
  fileId: string
  alt: string
  className?: string
}

export default function ThumbnailImage({ fileId, alt, className = '' }: ThumbnailImageProps) {
  const [src, setSrc] = useState<string | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    const fetchImage = async () => {
      try {
        const token = localStorage.getItem('nimbus_token')
        const url = getThumbnailUrl(fileId)
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
        
        if (!res.ok) throw new Error('Thumbnail not found')
        
        const blob = await res.blob()
        if (active) {
          setSrc(URL.createObjectURL(blob))
        }
      } catch (err) {
        if (active) setError(true)
      }
    }

    fetchImage()
    
    return () => {
      active = false
      if (src) URL.revokeObjectURL(src)
    }
  }, [fileId]) // eslint-disable-line

  if (error || !src) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <ImageIcon className="w-1/2 h-1/2 text-gray-400" />
      </div>
    )
  }

  return (
    <img src={src} alt={alt} className={`object-cover ${className}`} draggable={false} />
  )
}
