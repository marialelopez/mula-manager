import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Card, CardTitle } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import { useAlertas } from '../hooks/useAlertas'
import { formatCOP, rangoMesActual } from '../lib/utils'
import { Truck, Users, Route, DollarSign, Fuel, AlertTriangle, Clock } from 'lucide-react'

interface StatCardProps {
  icon: React.ElementType
  label: string
  value: string | number
  sub?: string
  color?: 'orange' | 'green' | 'blue' | 'red'
}

function StatCard({ icon: Icon, label, value, sub, color = 'orange' }: StatCardProps) {
  const colorMap: Record<string, string> = {
    orange: 'bg-brand-500/20 text-brand-400',
    green:  'bg-green-500/20 text-green-400',
    blue:   'bg-blue-500/20 text-blue-400',
    red:    'bg-red-500/20 text-red-400',
  }
  return (
    <Card className="flex items-start gap-4">
      <div className={`p-3 rounded-xl ${colorMap[color]}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-xs text-surface-500 mb-0.5">{label}</p>
        <p className="font-display font-bold text-2xl text-surface-50">{value}</p>
        {sub && <p className="text-xs text-surface-500 mt-1">{sub}</p>}
      </div>
    </Card>
  )
}

export default function Dashboard() {
  const { data: alertas = [] } = useAlertas()
  const { inicio, fin } = rangoMesActual()

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats', inicio, fin],
    queryFn: async () => {
      const [mulas, conductores, viajes, tanqueos] = await Promise.all([
        supabase.from('mulas').select('id', { count: 'exact' }).eq('activa', true),
        supabase.from('conductores').select('id', { count: 'exact' }).eq('activo', true),
        supabase.from('viajes').select('id, valor_flete, estado').gte('fecha_salida', inicio).lte('fecha_salida', fin),
        supabase.from('tanqueos').select('valor_total').gte('fecha', inicio).lte('fecha', fin),
      ])

      const viajesData = viajes.data ?? []
      const totalFletes   = viajesData.reduce((s, v) => s + (v.valor_flete ?? 0), 0)
      const totalTanqueos = (tanqueos.data ?? []).reduce((s, t) => s + (t.valor_total ?? 0), 0)
      const porCobrar     = viajesData.filter(v => v.estado !== 'pagado').reduce((s, v) => s + (v.valor_flete ?? 0), 0)

      return {
        mulas:       mulas.count ?? 0,
        conductores: conductores.count ?? 0,
        viajes:      viajesData.length,
        enRuta:      viajesData.filter(v => v.estado === 'en_ruta').length,
        totalFletes,
        totalTanqueos,
        porCobrar,
      }
    },
  })

  const { data: viajesRecientes } = useQuery({
    queryKey: ['viajes-recientes'],
    queryFn: async () => {
      const { data } = await supabase
        .from('viajes')
        .select('id, origen, destino, valor_flete, estado, mulas(placa), conductores(nombre)')
        .order('created_at', { ascending: false })
        .limit(5)
      return data ?? []
    },
  })

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Truck}       label="Mulas activas"   value={stats?.mulas ?? '-'} />
        <StatCard icon={Users}       label="Conductores"     value={stats?.conductores ?? '-'}  color="blue" />
        <StatCard icon={Route}       label="Viajes este mes" value={stats?.viajes ?? '-'} sub={`${stats?.enRuta ?? 0} en ruta`} color="green" />
        <StatCard icon={DollarSign}  label="Fletes este mes" value={stats ? formatCOP(stats.totalFletes) : '-'} sub={`Por cobrar: ${stats ? formatCOP(stats.porCobrar) : '-'}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alertas */}
        <div className="space-y-3">
          <Card>
            <CardTitle>
              <span className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-brand-400" />
                Alertas ({alertas.length})
              </span>
            </CardTitle>
            <div className="space-y-2">
              {alertas.length === 0 && (
                <p className="text-surface-500 text-sm">Sin alertas pendientes ✓</p>
              )}
              {alertas.slice(0, 6).map(a => (
                <div
                  key={a.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    a.urgencia === 'alta'  ? 'bg-red-500/10 border-red-500/20' :
                    a.urgencia === 'media' ? 'bg-yellow-500/10 border-yellow-500/20' :
                    'bg-surface-800 border-surface-700'
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
              ))}
            </div>
          </Card>

          <Card>
            <CardTitle>
              <span className="flex items-center gap-2">
                <Fuel size={18} className="text-brand-400" />
                Combustible este mes
              </span>
            </CardTitle>
            <p className="font-display font-bold text-2xl text-surface-50">
              {stats ? formatCOP(stats.totalTanqueos) : '-'}
            </p>
          </Card>
        </div>

        {/* Viajes recientes */}
        <Card className="lg:col-span-2">
          <CardTitle>
            <span className="flex items-center gap-2">
              <Clock size={18} className="text-brand-400" />
              Viajes recientes
            </span>
          </CardTitle>
          <div className="space-y-2">
            {(viajesRecientes ?? []).map((v: any) => (
              <div key={v.id} className="flex items-center justify-between p-3 bg-surface-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-brand-500/20 rounded-lg flex items-center justify-center">
                    <Truck size={14} className="text-brand-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-surface-100">
                      {v.mulas?.placa} · {v.conductores?.nombre}
                    </p>
                    <p className="text-xs text-surface-500">{v.origen} → {v.destino}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge color={
                    v.estado === 'en_ruta'            ? 'blue' :
                    v.estado === 'pagado'             ? 'green' :
                    v.estado === 'pendiente_remision' ? 'yellow' : 'green'
                  }>
                    {v.estado === 'en_ruta'            ? 'En ruta' :
                     v.estado === 'pagado'             ? 'Pagado' :
                     v.estado === 'pendiente_remision' ? 'Pte. remisión' : 'Completado'}
                  </Badge>
                  <p className="text-xs text-surface-500 mt-1">{formatCOP(v.valor_flete ?? 0)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}