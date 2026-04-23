import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useConductores } from '../hooks/useConductores'
import { Card, CardTitle } from '../components/ui/Card'
import Button from '../components/ui/Button'
import { Select } from '../components/ui/Input'
import { DollarSign, Shield, CheckCircle } from 'lucide-react'
import { formatCOP } from '../lib/utils'

const MESES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
]

export default function Liquidacion() {
  const { data: conductores = [] } = useConductores()
  const qc = useQueryClient()
  const hoy = new Date()

  const [mes, setMes]               = useState(hoy.getMonth() + 1)
  const [año, setAño]               = useState(hoy.getFullYear())
  const [conductorId, setConductorId] = useState('')

  const { data: config } = useQuery({
    queryKey: ['config'],
    queryFn: async () => {
      const { data } = await supabase.from('configuracion').select('*')
      const map: Record<string, string> = {}
      ;(data ?? []).forEach(c => { map[c.clave] = c.valor })
      return map
    },
  })

  const sueldoBase        = +(config?.sueldo_base        ?? 1000000)
  const porcentajeComision = +(config?.porcentaje_comision ?? 8)

  const { data: liq } = useQuery({
    queryKey: ['liquidacion', conductorId, mes, año],
    enabled: !!conductorId,
    queryFn: async () => {
      const inicio = `${año}-${String(mes).padStart(2, '0')}-01`
      const fin    = new Date(año, mes, 0).toISOString().split('T')[0]

      const [viajesRes, adelantosRes, ssRes] = await Promise.all([
        supabase.from('viajes')
          .select('valor_flete, anticipo')
          .eq('conductor_id', conductorId)
          .gte('fecha_salida', inicio)
          .lte('fecha_salida', fin),
        supabase.from('adelantos')
          .select('monto')
          .eq('conductor_id', conductorId)
          .eq('mes_descuento', mes)
          .eq('año_descuento', año),
        supabase.from('pagos_seguridad_social')
          .select('*')
          .eq('conductor_id', conductorId)
          .eq('mes', mes)
          .eq('año', año)
          .maybeSingle(),
      ])

      const viajesData   = viajesRes.data   ?? []
      const adelantosData = adelantosRes.data ?? []

      const totalFletes     = viajesData.reduce((s, v) => s + (v.valor_flete ?? 0), 0)
      const totalAnticipos  = viajesData.reduce((s, v) => s + (v.anticipo    ?? 0), 0)
      const totalAdelantos  = adelantosData.reduce((s, a) => s + (a.monto    ?? 0), 0)
      const totalComisiones = totalFletes * (porcentajeComision / 100)
      const totalBruto      = sueldoBase + totalComisiones
      const totalDescuentos = totalAnticipos + totalAdelantos
      const neto            = totalBruto - totalDescuentos

      return {
        viajes: viajesData,
        totalFletes, totalAnticipos, totalAdelantos,
        totalComisiones, totalBruto, totalDescuentos, neto,
        ss: ssRes.data,
      }
    },
  })

  const marcarSS = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('pagos_seguridad_social').upsert(
        {
          conductor_id: conductorId,
          mes, año,
          estado:     'pagado',
          fecha_pago: new Date().toISOString().split('T')[0],
        },
        { onConflict: 'conductor_id,mes,año' }
      )
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['liquidacion'] }),
  })

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Select label="Conductor" value={conductorId} onChange={e => setConductorId(e.target.value)}>
          <option value="">Seleccionar conductor...</option>
          {conductores.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </Select>
        <Select label="Mes" value={mes} onChange={e => setMes(+e.target.value)}>
          {MESES.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
        </Select>
        <Select label="Año" value={año} onChange={e => setAño(+e.target.value)}>
          {[2024, 2025, 2026, 2027].map(a => <option key={a} value={a}>{a}</option>)}
        </Select>
      </div>

      {!conductorId && (
        <p className="text-surface-500 text-sm">Selecciona un conductor para ver su liquidación.</p>
      )}

      {liq && conductorId && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Liquidación */}
          <Card>
            <CardTitle>
              <span className="flex items-center gap-2">
                <DollarSign size={18} className="text-brand-400" />
                Liquidación — {MESES[mes - 1]} {año}
              </span>
            </CardTitle>
            <div className="space-y-3">
              {[
                { label: 'Sueldo base',            value: formatCOP(sueldoBase),           color: 'text-surface-100' },
                { label: 'Viajes del mes',          value: `${liq.viajes.length} viajes`,   color: 'text-surface-100' },
                { label: 'Total fletes',            value: formatCOP(liq.totalFletes),      color: 'text-surface-100' },
                { label: `Comisiones (${porcentajeComision}%)`, value: `+${formatCOP(liq.totalComisiones)}`, color: 'text-green-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-surface-400">{label}</span>
                  <span className={`font-mono ${color}`}>{value}</span>
                </div>
              ))}

              <div className="border-t border-surface-800 my-1" />

              <div className="flex justify-between text-sm font-semibold">
                <span className="text-surface-300">Total bruto</span>
                <span className="font-mono text-surface-50">{formatCOP(liq.totalBruto)}</span>
              </div>

              {[
                { label: 'Anticipos viajes',  value: `-${formatCOP(liq.totalAnticipos)}` },
                { label: 'Adelantos sueldo',  value: `-${formatCOP(liq.totalAdelantos)}` },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-surface-400">{label}</span>
                  <span className="font-mono text-red-400">{value}</span>
                </div>
              ))}

              <div className="border-t border-surface-800 my-1" />

              <div className="flex justify-between font-display font-bold text-lg">
                <span className="text-surface-100">A pagar</span>
                <span className={`font-mono ${liq.neto >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCOP(liq.neto)}
                </span>
              </div>
            </div>
          </Card>

          {/* Seguridad Social */}
          <Card>
            <CardTitle>
              <span className="flex items-center gap-2">
                <Shield size={18} className="text-brand-400" />
                Seguridad Social
              </span>
            </CardTitle>
            <div className="space-y-4">
              <div className={`p-4 rounded-xl border ${
                liq.ss?.estado === 'pagado'
                  ? 'bg-green-500/10 border-green-500/20'
                  : 'bg-red-500/10 border-red-500/20'
              }`}>
                <div className="flex items-center gap-3">
                  <Shield size={20} className={liq.ss?.estado === 'pagado' ? 'text-green-400' : 'text-red-400'} />
                  <div>
                    <p className="font-semibold text-surface-100">
                      {liq.ss?.estado === 'pagado' ? '✓ Pagada' : 'Pendiente de pago'}
                    </p>
                    <p className="text-xs text-surface-500">{MESES[mes - 1]} {año}</p>
                  </div>
                </div>
              </div>

              {liq.ss?.estado !== 'pagado' && (
                <Button
                  className="w-full"
                  onClick={() => marcarSS.mutateAsync()}
                  disabled={marcarSS.isPending}
                >
                  <CheckCircle size={16} /> Marcar como pagada
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}