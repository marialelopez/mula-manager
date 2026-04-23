import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { diasParaFecha } from '../lib/utils'

export interface Alerta {
  id: string
  tipo: 'seguridad_social' | 'colpass_bajo' | 'viaje_pendiente'
  urgencia: 'alta' | 'media' | 'baja'
  titulo: string
  descripcion: string
  fecha?: string
}

export function useAlertas() {
  return useQuery({
    queryKey: ['alertas'],
    queryFn: async (): Promise<Alerta[]> => {
      const alertas: Alerta[] = []
      const hoy = new Date()
      const mes = hoy.getMonth() + 1
      const año = hoy.getFullYear()

      // Seguridad social
      const { data: conductores } = await supabase
        .from('conductores')
        .select('id, nombre, dia_pago_seguridad_social')
        .eq('activo', true)

      const { data: pagos } = await supabase
        .from('pagos_seguridad_social')
        .select('conductor_id, estado')
        .eq('mes', mes)
        .eq('año', año)

      const pagadosIds = new Set(
        (pagos ?? []).filter(p => p.estado === 'pagado').map(p => p.conductor_id)
      )

      ;(conductores ?? []).forEach(c => {
        if (pagadosIds.has(c.id)) return
        const dias = diasParaFecha(c.dia_pago_seguridad_social)
        alertas.push({
          id: `ss-${c.id}`,
          tipo: 'seguridad_social',
          urgencia: dias <= 2 ? 'alta' : dias <= 5 ? 'media' : 'baja',
          titulo: `Seguridad Social: ${c.nombre}`,
          descripcion:
            dias === 0 ? '¡Pago HOY!'
            : dias < 0 ? `¡Vencida hace ${Math.abs(dias)} días!`
            : `Vence en ${dias} días`,
        })
      })

      // Colpass bajo
      const { data: mulas } = await supabase
        .from('mulas')
        .select('id, placa, saldo_colpass')
        .eq('activa', true)

      ;(mulas ?? []).forEach(m => {
        if (m.saldo_colpass < 50000) {
          alertas.push({
            id: `colpass-${m.id}`,
            tipo: 'colpass_bajo',
            urgencia: m.saldo_colpass <= 0 ? 'alta' : 'media',
            titulo: `Colpass bajo: ${m.placa}`,
            descripcion: `Saldo: $${m.saldo_colpass.toLocaleString('es-CO')}`,
          })
        }
      })

      // Viajes pendientes de remisión
      const { data: viajesPend } = await supabase
        .from('viajes')
        .select('id, origen, destino, fecha_salida, mulas(placa)')
        .eq('estado', 'pendiente_remision')

      ;(viajesPend ?? []).forEach((v: any) => {
        alertas.push({
          id: `viaje-${v.id}`,
          tipo: 'viaje_pendiente',
          urgencia: 'baja',
          titulo: `Remisión pendiente: ${v.mulas?.placa ?? ''}`,
          descripcion: `${v.origen} → ${v.destino}`,
          fecha: v.fecha_salida,
        })
      })

      return alertas.sort((a, b) => {
        const orden = { alta: 0, media: 1, baja: 2 }
        return orden[a.urgencia] - orden[b.urgencia]
      })
    },
    refetchInterval: 1000 * 60 * 5,
  })
}