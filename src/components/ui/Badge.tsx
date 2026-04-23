import { cn } from '../../lib/utils'

const colors: Record<string, string> = {
  green:  'bg-green-500/15 text-green-400 border-green-500/30',
  yellow: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  red:    'bg-red-500/15 text-red-400 border-red-500/30',
  blue:   'bg-blue-500/15 text-blue-400 border-blue-500/30',
  orange: 'bg-brand-500/15 text-brand-400 border-brand-500/30',
  gray:   'bg-surface-700/50 text-surface-400 border-surface-600',
}

export const ESTADO_VIAJE: Record<string, { label: string; color: string }> = {
  en_ruta:            { label: 'En ruta',        color: 'blue' },
  completado:         { label: 'Completado',      color: 'green' },
  pendiente_remision: { label: 'Pte. Remisión',   color: 'yellow' },
  pagado:             { label: 'Pagado',           color: 'green' },
}

interface BadgeProps {
  color?: string
  children: React.ReactNode
  className?: string
}

export default function Badge({ color = 'gray', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border',
        colors[color] ?? colors.gray,
        className
      )}
    >
      {children}
    </span>
  )
}