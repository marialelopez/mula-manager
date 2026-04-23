import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Card, CardTitle } from '../components/ui/Card'
import { Input, Select } from '../components/ui/Input'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { formatCOP } from '../lib/utils'

const COLORS = ['#ff7f0a', '#3b82f6', '#22c55e', '#a855f7', '#f59e0b', '#ef4444']

export default function Reportes() {
  const hoy = new Date()
  const [desde, setDesde] = useState(`${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2,'0')}-01`)
  const [hasta, setHasta] = useState(hoy.toISOString().split('T')[0])
  const [mula, setMula] = useState('')

  const { data: mulas = [] } = useQuery({
    queryKey: ['mulas'],
    queryFn: async () => {
      const { data } = await supabase.from('mulas').select('id, placa')
      return data || []
    }
  })

  const { data: reporte } = useQuery({
    queryKey: ['reporte', desde, hasta, mula],
    queryFn: async () => {
      let vq = supabase.from('viajes').select('valor_flete, anticipo, estado, fecha_salida').gte('fecha_salida', desde).lte('fecha_salida', hasta)
      let gq = supabase.from('gastos').select('monto, tipos_gasto(nombre, categoria), fecha').gte('fecha', desde).lte('fecha', hasta)
      let tq = supabase.from('tanqueos').select('valor_total, fecha').gte('fecha', desde).lte('fecha', hasta)
      let rq = supabase.from('recargas_colpass').select('monto, fecha').gte('fecha', desde).lte('fecha', hasta)

      if (mula) {
        vq = vq.eq('mula_id', mula)
        tq = tq.eq('mula_id', mula)
        rq = rq.eq('mula_id', mula)
      }

      const [viajes, gastos, tanqueos, peajes] = await Promise.all([vq, gq, tq, rq])

      const totalFletes     = (viajes.data || []).reduce((s, v) => s + (v.valor_flete ?? 0), 0)
      const totalCobrado    = (viajes.data || []).filter(v => v.estado === 'pagado').reduce((s, v) => s + (v.valor_flete ?? 0), 0)
      const porCobrar       = totalFletes - totalCobrado
      const totalAnticipos  = (viajes.data || []).reduce((s, v) => s + (v.anticipo ?? 0), 0)
      const gastosConductor = (gastos.data || []).filter((g: any) => g.tipos_gasto?.categoria === 'conductor').reduce((s, g) => s + g.monto, 0)
      const gastosMula      = (gastos.data || []).filter((g: any) => g.tipos_gasto?.categoria === 'mula').reduce((s, g) => s + g.monto, 0)
      const totalTanqueos   = (tanqueos.data || []).reduce((s, t) => s + t.valor_total, 0)
      const totalPeajes     = (peajes.data || []).reduce((s, p) => s + p.monto, 0)
      const totalEgresos    = gastosConductor + gastosMula + totalTanqueos + totalPeajes + totalAnticipos

      const gastosAgrupados: Record<string, number> = {}
      ;(gastos.data || []).forEach((g: any) => {
        const nombre = g.tipos_gasto?.nombre || 'Otros'
        gastosAgrupados[nombre] = (gastosAgrupados[nombre] || 0) + g.monto
      })
      const gastosPie = Object.entries(gastosAgrupados).map(([name, value]) => ({ name, value }))

      const barData = [
        { name: 'Fletes',      value: totalFletes },
        { name: 'Anticipos',   value: totalAnticipos },
        { name: 'Combustible', value: totalTanqueos },
        { name: 'Gto. Cond.', value: gastosConductor },
        { name: 'Gto. Mula',  value: gastosMula },
        { name: 'Peajes',      value: totalPeajes },
      ]

      return {
        totalFletes, totalCobrado, porCobrar, totalAnticipos,
        gastosConductor, gastosMula, totalTanqueos, totalPeajes,
        totalEgresos, gastosPie, barData,
        viajesCount: (viajes.data || []).length
      }
    }
  })

  const tooltipStyle = {
    backgroundColor: '#46403a', border: '1px solid #645d55',
    borderRadius: 8, color: '#f8f7f4', fontSize: 12
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <Input label="Desde" type="date" value={desde} onChange={e => setDesde(e.target.value)} />
        <Input label="Hasta" type="date" value={hasta} onChange={e => setHasta(e.target.value)} />
        <Select label="Mula" value={mula} onChange={e => setMula(e.target.value)}>
          <option value="">Todas las mulas</option>
          {(mulas as any[]).map((m: any) => (
            <option key={m.id} value={m.id}>{m.placa}</option>
          ))}
        </Select>
      </div>

      {reporte && (
        <>
          {/* Tarjetas resumen */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total fletes',   value: reporte.totalFletes,   color: 'text-green-400' },
              { label: 'Cobrado',        value: reporte.totalCobrado,  color: 'text-green-400' },
              { label: 'Por cobrar',     value: reporte.porCobrar,     color: 'text-yellow-400' },
              { label: 'Total egresos',  value: reporte.totalEgresos,  color: 'text-red-400' },
            ].map(({ label, value, color }) => (
              <Card key={label}>
                <p className="text-xs text-surface-500 mb-1">{label}</p>
                <p className={`font-display font-bold text-xl ${color}`}>{formatCOP(value)}</p>
              </Card>
            ))}
          </div>

          {/* Graficas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardTitle>Ingresos vs Egresos</CardTitle>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={reporte.barData}>
                  <XAxis dataKey="name" tick={{ fill: '#908980', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={v => `$${(v/1000000).toFixed(1)}M`} tick={{ fill: '#908980', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => formatCOP(v)} />
                  <Bar dataKey="value" fill="#ff7f0a" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <CardTitle>Distribución de gastos</CardTitle>
              {reporte.gastosPie.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={reporte.gastosPie}
                      dataKey="value"
                      nameKey="name"
                      cx="50%" cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                      fontSize={11}
                    >
                      {reporte.gastosPie.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => formatCOP(v)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-surface-500 text-sm">Sin gastos en el período</p>
              )}
            </Card>
          </div>

          {/* Resumen detallado */}
          <Card>
            <CardTitle>Resumen detallado</CardTitle>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              {[
                { label: 'Viajes realizados',    value: reporte.viajesCount,                                    unit: ' viajes' },
                { label: 'Anticipos conductores', value: formatCOP(reporte.totalAnticipos),                     unit: '' },
                { label: 'Combustible',           value: formatCOP(reporte.totalTanqueos),                      unit: '' },
                { label: 'Gastos conductor',      value: formatCOP(reporte.gastosConductor),                    unit: '' },
                { label: 'Gastos mula',           value: formatCOP(reporte.gastosMula),                         unit: '' },
                { label: 'Peajes (recargas)',      value: formatCOP(reporte.totalPeajes),                        unit: '' },
                { label: 'Utilidad aprox.',        value: formatCOP(reporte.totalFletes - reporte.totalEgresos), unit: '' },
              ].map(({ label, value, unit }) => (
                <div key={label} className="p-3 bg-surface-800 rounded-lg">
                  <p className="text-surface-500 text-xs mb-1">{label}</p>
                  <p className="font-mono font-semibold text-surface-100">{value}{unit}</p>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}