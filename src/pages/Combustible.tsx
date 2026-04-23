import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useMulas } from '../hooks/useMulas'
import { Card } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import { Input, Select } from '../components/ui/Input'
import { Plus, Fuel, Trash2 } from 'lucide-react'
import { formatCOP, formatDate } from '../lib/utils'

export default function Combustible() {
  const { data: mulas = [] } = useMulas()
  const qc = useQueryClient()

  const { data: tanqueos = [] } = useQuery({
    queryKey: ['tanqueos'],
    queryFn: async () => {
      const { data } = await supabase.from('tanqueos').select('*, mulas(placa)').order('fecha', { ascending: false })
      return data || []
    }
  })

  const create = useMutation({
    mutationFn: async (t: any) => { await supabase.from('tanqueos').insert(t) },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tanqueos'] })
  })
  const remove = useMutation({
    mutationFn: async (id: string) => { await supabase.from('tanqueos').delete().eq('id', id) },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tanqueos'] })
  })

  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ mula_id: '', fecha: new Date().toISOString().split('T')[0], litros: '', valor_total: '', estacion: '', kilometraje: '', notas: '' })

  const handleSubmit = async () => {
    await create.mutateAsync({ ...form, litros: form.litros ? +form.litros : null, valor_total: +form.valor_total, kilometraje: form.kilometraje ? +form.kilometraje : null })
    setModal(false)
  }

  const total = (tanqueos as any[]).reduce((s, t) => s + t.valor_total, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-surface-400 text-sm">{(tanqueos as any[]).length} tanqueos · {formatCOP(total)}</p>
        <Button onClick={() => setModal(true)}><Plus size={16} /> Registrar Tanqueo</Button>
      </div>

      <div className="space-y-2">
        {(tanqueos as any[]).map((t: any) => (
          <Card key={t.id} className="flex items-center gap-4 py-3">
            <div className="p-2 bg-brand-500/20 rounded-lg">
              <Fuel size={18} className="text-brand-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-surface-100">
                {t.mulas?.placa} · {t.estacion || 'Sin estación'}
              </p>
              <p className="text-xs text-surface-500">
                {formatDate(t.fecha)}
                {t.litros && ` · ${t.litros}L`}
                {t.kilometraje && ` · ${t.kilometraje.toLocaleString()} km`}
              </p>
            </div>
            <span className="font-mono font-semibold text-brand-400">{formatCOP(t.valor_total)}</span>
            <Button size="sm" variant="danger" onClick={() => remove.mutateAsync(t.id)}><Trash2 size={14} /></Button>
          </Card>
        ))}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Registrar Tanqueo">
        <div className="space-y-4">
  <Select label="Mula *" value={form.mula_id} onChange={e => setForm(f => ({ ...f, mula_id: e.target.value }))}>
    <option value="">Seleccionar...</option>
    {mulas.map(m => <option key={m.id} value={m.id}>{m.placa}</option>)}
  </Select>
  <Input
    label="Fecha"
    type="date"
    value={form.fecha}
    onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
  />
  <Input
    label="Valor total ($) *"
    type="number"
    value={form.valor_total}
    onChange={e => setForm(f => ({ ...f, valor_total: e.target.value }))}
  />
  <div className="flex gap-3 pt-2">
    <Button className="flex-1" onClick={handleSubmit} disabled={!form.mula_id || !form.valor_total}>
      Registrar
    </Button>
    <Button variant="secondary" onClick={() => setModal(false)}>Cancelar</Button>
  </div>
</div>
      </Modal>
    </div>
  )
}