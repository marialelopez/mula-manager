import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Viaje } from '../types'

interface FiltrosViaje {
  mula_id?: string
  conductor_id?: string
  estado?: string
  desde?: string
  hasta?: string
}

export function useViajes(filtros?: FiltrosViaje) {
  return useQuery({
    queryKey: ['viajes', filtros],
    queryFn: async () => {
      let q = supabase
        .from('viajes')
        .select('*, mulas(placa), conductores(nombre), empresas(nombre), gastos(*, tipos_gasto(nombre, categoria))')
        .order('fecha_salida', { ascending: false })

      if (filtros?.mula_id)      q = q.eq('mula_id', filtros.mula_id)
      if (filtros?.conductor_id) q = q.eq('conductor_id', filtros.conductor_id)
      if (filtros?.estado)       q = q.eq('estado', filtros.estado)
      if (filtros?.desde)        q = q.gte('fecha_salida', filtros.desde)
      if (filtros?.hasta)        q = q.lte('fecha_salida', filtros.hasta)

      const { data, error } = await q
      if (error) throw error
      return (data ?? []) as Viaje[]
    },
  })
}

export function useCreateViaje() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (viaje: Omit<Viaje, 'id' | 'created_at' | 'updated_at' | 'mulas' | 'conductores' | 'empresas' | 'gastos'>) => {
      const { data, error } = await supabase.from('viajes').insert(viaje).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['viajes'] }),
  })
}

export function useUpdateViaje() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Viaje> & { id: string }) => {
      const { mulas: _m, conductores: _c, empresas: _e, gastos: _g, ...cleanUpdates } = updates as any
      const { data, error } = await supabase
        .from('viajes')
        .update({ ...cleanUpdates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['viajes'] }),
  })
}