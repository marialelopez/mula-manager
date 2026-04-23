import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Gasto, TipoGasto } from '../types'

interface FiltrosGasto {
  desde?: string
  hasta?: string
}

export function useGastos(filtros?: FiltrosGasto) {
  return useQuery({
    queryKey: ['gastos', filtros],
    queryFn: async () => {
      let q = supabase
        .from('gastos')
        .select('*, tipos_gasto(*), viajes(origen, destino), mulas(placa), conductores(nombre)')
        .order('fecha', { ascending: false })
      if (filtros?.desde) q = q.gte('fecha', filtros.desde)
      if (filtros?.hasta) q = q.lte('fecha', filtros.hasta)
      const { data, error } = await q
      if (error) throw error
      return (data ?? []) as Gasto[]
    },
  })
}

export function useTiposGasto() {
  return useQuery({
    queryKey: ['tipos_gasto'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tipos_gasto')
        .select('*')
        .eq('activo', true)
        .order('nombre')
      if (error) throw error
      return (data ?? []) as TipoGasto[]
    },
  })
}

export function useCreateGasto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (gasto: Omit<Gasto, 'id' | 'tipos_gasto' | 'viajes' | 'mulas' | 'conductores'>) => {
      const { data, error } = await supabase.from('gastos').insert(gasto).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gastos'] })
      qc.invalidateQueries({ queryKey: ['viajes'] })
    },
  })
}