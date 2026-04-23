import { ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
}

const variants = {
  primary: 'bg-brand-500 hover:bg-brand-400 text-white border-transparent',
  secondary: 'bg-surface-800 hover:bg-surface-700 text-surface-100 border-surface-700',
  ghost: 'bg-transparent hover:bg-surface-800 text-surface-300 border-transparent',
  danger: 'bg-red-600/20 hover:bg-red-600/30 text-red-400 border-red-600/30',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export default function Button({ variant = 'primary', size = 'md', children, className, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={cn(
        'inline-flex items-center gap-2 font-medium rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant], sizes[size], className
      )}
    >
      {children}
    </button>
  )
}