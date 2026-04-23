import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Mula } from '../types'

export function useMulas() {
  return useQuery({
    queryKey: ['mulas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mulas')
        .select('*, conductores(*)')
        .order('placa')
      if (error) throw error
      return (data ?? []) as Mula[]
    },
  })
}

export function useCreateMula() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (mula: Omit<Mula, 'id' | 'created_at' | 'updated_at' | 'conductores'>) => {
      const { data, error } = await supabase.from('mulas').insert(mula).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mulas'] }),
  })
}

export function useUpdateMula() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Mula> & { id: string }) => {
      const { conductores: _c, ...cleanUpdates } = updates as any
      const { data, error } = await supabase
        .from('mulas')
        .update({ ...cleanUpdates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mulas'] }),
  })
}

export function useDeleteMula() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('mulas').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mulas'] }),
  })
}