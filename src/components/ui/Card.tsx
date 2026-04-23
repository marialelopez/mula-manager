import { ReactNode } from 'react'
import { cn } from '../../lib/utils'

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('bg-surface-900 border border-surface-800 rounded-xl p-5', className)}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={cn('font-display font-semibold text-surface-100 mb-4', className)}>
      {children}
    </h3>
  )
}