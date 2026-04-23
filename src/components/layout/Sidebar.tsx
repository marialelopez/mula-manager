import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Truck, Users, Route, Receipt,
  Fuel, CreditCard, Wallet, BarChart3, Settings,
  DollarSign, ChevronLeft, Wrench
} from 'lucide-react'
import { cn } from '../../lib/utils'

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/mulas', icon: Truck, label: 'Mulas' },
  { to: '/conductores', icon: Users, label: 'Conductores' },
  { to: '/viajes', icon: Route, label: 'Viajes' },
  { to: '/gastos', icon: Receipt, label: 'Gastos' },
  { to: '/combustible', icon: Fuel, label: 'Combustible' },
  { to: '/peajes', icon: CreditCard, label: 'Peajes' },
  { to: '/adelantos', icon: Wallet, label: 'Adelantos' },
  { to: '/liquidacion', icon: DollarSign, label: 'Liquidación' },
  { to: '/reportes', icon: BarChart3, label: 'Reportes' },
  { to: '/configuracion', icon: Settings, label: 'Configuración' },
]

interface Props {
  open: boolean
  onToggle: () => void
}

export default function Sidebar({ open, onToggle }: Props) {
  return (
    <aside className={cn(
      'flex flex-col bg-surface-900 border-r border-surface-800 transition-all duration-300 relative',
      open ? 'w-60' : 'w-16'
    )}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-surface-800">
        <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <Truck size={18} className="text-white" />
        </div>
        {open && (
          <span className="font-display font-bold text-lg text-surface-50 whitespace-nowrap">
            Mula Manager
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium',
              isActive
                ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                : 'text-surface-400 hover:bg-surface-800 hover:text-surface-100'
            )}
          >
            <Icon size={18} className="flex-shrink-0" />
            {open && <span className="whitespace-nowrap">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Toggle btn */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 bg-surface-800 border border-surface-700 rounded-full flex items-center justify-center hover:bg-surface-700 transition-colors"
      >
        <ChevronLeft size={14} className={cn('text-surface-400 transition-transform', !open && 'rotate-180')} />
      </button>
    </aside>
  )
}