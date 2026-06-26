import { create } from 'zustand'
import { type CloudFile } from '../api/files'

type ClipboardOp = 'cut' | 'copy'

interface ClipboardState {
  items: CloudFile[]
  operation: ClipboardOp | null
  copy: (files: CloudFile[]) => void
  cut: (files: CloudFile[]) => void
  clear: () => void
}

export const useClipboardStore = create<ClipboardState>((set) => ({
  items: [],
  operation: null,
  copy: (files) => set({ items: files, operation: 'copy' }),
  cut: (files) => set({ items: files, operation: 'cut' }),
  clear: () => set({ items: [], operation: null }),
}))
