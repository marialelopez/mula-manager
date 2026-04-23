import { ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export default function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const sizes = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative bg-surface-900 border border-surface-700 rounded-2xl w-full shadow-2xl', sizes[size])}>
        <div className="flex items-center justify-between p-5 border-b border-surface-800">
          <h2 className="font-display font-semibold text-lg text-surface-50">{title}</h2>
          <button onClick={onClose} className="text-surface-500 hover:text-surface-200 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-5 max-h-[75vh] overflow-y-auto scrollbar-thin">
          {children}
        </div>
      </div>
    </div>
  )
}