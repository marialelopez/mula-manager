import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Conductor } from '../types'

export function useConductores() {
  return useQuery({
    queryKey: ['conductores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conductores')
        .select('*, mulas(placa, marca)')
        .order('nombre')
      if (error) throw error
      return (data ?? []) as Conductor[]
    },
  })
}

export function useCreateConductor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (conductor: Omit<Conductor, 'id' | 'created_at' | 'mulas'>) => {
      const { data, error } = await supabase
        .from('conductores')
        .insert(conductor)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conductores'] }),
  })
}

export function useUpdateConductor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Conductor> & { id: string }) => {
      const { mulas: _m, ...cleanUpdates } = updates as any
      const { data, error } = await supabase
        .from('conductores')
        .update(cleanUpdates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conductores'] }),
  })
}