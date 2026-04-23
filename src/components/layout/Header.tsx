import { useState } from 'react'
import { Menu, Bell, X } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useAlertas } from '../../hooks/useAlertas'

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/mulas': 'Mulas',
  '/conductores': 'Conductores',
  '/viajes': 'Viajes & Fletes',
  '/gastos': 'Gastos',
  '/combustible': 'Combustible',
  '/peajes': 'Peajes Colpass',
  '/adelantos': 'Adelantos',
  '/liquidacion': 'Liquidación',
  '/reportes': 'Reportes',
  '/configuracion': 'Configuración',
}

export default function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { pathname } = useLocation()
  const title = PAGE_TITLES[pathname] || 'Mula Manager'
  const today = new Date().toLocaleDateString('es-CO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })
  const { data: alertas = [] } = useAlertas()
  const [showAlertas, setShowAlertas] = useState(false)

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-surface-900 border-b border-surface-800 flex-shrink-0 relative">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="text-surface-400 hover:text-surface-100 transition-colors">
          <Menu size={20} />
        </button>
        <div>
          <h1 className="font-display font-bold text-xl text-surface-50">{title}</h1>
          <p className="text-xs text-surface-500 capitalize">{today}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Campana con panel de alertas */}
        <div className="relative">
          <button
            onClick={() => setShowAlertas(!showAlertas)}
            className="relative text-surface-400 hover:text-surface-100 transition-colors p-2"
          >
            <Bell size={18} />
            {alertas.length > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-brand-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {alertas.length}
              </span>
            )}
          </button>

          {showAlertas && (
            <div className="absolute right-0 top-12 w-80 bg-surface-900 border border-surface-700 rounded-xl shadow-2xl z-50">
              <div className="flex items-center justify-between p-4 border-b border-surface-800">
                <h3 className="font-display font-semibold text-surface-100 text-sm">
                  Alertas ({alertas.length})
                </h3>
                <button
                  onClick={() => setShowAlertas(false)}
                  className="text-surface-500 hover:text-surface-200 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto scrollbar-thin">
                {alertas.length === 0 ? (
                  <p className="text-surface-500 text-sm p-4">Sin alertas pendientes ✓</p>
                ) : (
                  alertas.map(a => (
                    <div
                      key={a.id}
                      className={`flex items-start gap-3 p-3 border-b border-surface-800 last:border-0 ${
                        a.urgencia === 'alta'  ? 'bg-red-500/10' :
                        a.urgencia === 'media' ? 'bg-yellow-500/10' : ''
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                        a.urgencia === 'alta'  ? 'bg-red-400' :
                        a.urgencia === 'media' ? 'bg-yellow-400' : 'bg-surface-500'
                      }`} />
                      <div>
                        <p className="text-sm font-medium text-surface-100">{a.titulo}</p>
                        <p className="text-xs text-surface-500">{a.descripcion}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">MM</span>
        </div>
      </div>
    </header>
  )
}