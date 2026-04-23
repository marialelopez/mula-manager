import { cn } from '../../lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-surface-400">{label}</label>}
      <input
        {...props}
        className={cn(
          'bg-surface-800 border border-surface-700 rounded-lg px-3 py-2.5 text-sm text-surface-100',
          'placeholder:text-surface-600 focus:outline-none focus:border-brand-500/60 focus:ring-1 focus:ring-brand-500/30 transition-colors',
          error && 'border-red-500/50',
          className
        )}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  children: React.ReactNode
}

export function Select({ label, error, className, children, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-surface-400">{label}</label>}
      <select
        {...props}
        className={cn(
          'bg-surface-800 border border-surface-700 rounded-lg px-3 py-2.5 text-sm text-surface-100',
          'focus:outline-none focus:border-brand-500/60 focus:ring-1 focus:ring-brand-500/30 transition-colors',
          error && 'border-red-500/50',
          className
        )}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}