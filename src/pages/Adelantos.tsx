import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useConductores } from '../hooks/useConductores'
import { Card } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Badge from '../components/ui/Badge'
import { Input, Select } from '../components/ui/Input'
import { Plus, Wallet, Upload, Trash2, Image } from 'lucide-react'
import { formatCOP, formatDate } from '../lib/utils'

export default function Adelantos() {
  const { data: conductores = [] } = useConductores()
  const qc = useQueryClient()

  const { data: adelantos = [] } = useQuery({
    queryKey: ['adelantos'],
    queryFn: async () => {
      const { data } = await supabase.from('adelantos').select('*, conductores(nombre)').order('fecha', { ascending: false })
      return data || []
    }
  })

  const create = useMutation({
    mutationFn: async ({ form, file }: { form: any; file: File | null }) => {
      let comprobante_url = null
      if (file) {
        const path = `adelantos/${Date.now()}_${file.name}`
        await supabase.storage.from('comprobantes').upload(path, file)
        const { data: { publicUrl } } = supabase.storage.from('comprobantes').getPublicUrl(path)
        comprobante_url = publicUrl
      }
      await supabase.from('adelantos').insert({ ...form, monto: +form.monto, comprobante_url })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['adelantos'] })
  })

  const remove = useMutation({
    mutationFn: async (id: string) => { await supabase.from('adelantos').delete().eq('id', id) },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['adelantos'] })
  })

  const [modal, setModal] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [form, setForm] = useState({
    conductor_id: '', fecha: new Date().toISOString().split('T')[0],
    monto: '', tipo: 'transferencia', descripcion: '',
    mes_descuento: new Date().getMonth() + 1, año_descuento: new Date().getFullYear()
  })

  const total = (adelantos as any[]).reduce((s, a) => s + a.monto, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-surface-400 text-sm">{(adelantos as any[]).length} adelantos · {formatCOP(total)}</p>
        <Button onClick={() => setModal(true)}><Plus size={16} /> Nuevo Adelanto</Button>
      </div>

      <div className="space-y-2">
        {(adelantos as any[]).map((a: any) => (
          <Card key={a.id} className="flex items-center gap-4 py-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Wallet size={18} className="text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-surface-100">{a.conductores?.nombre}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-surface-500">{formatDate(a.fecha)}</span>
                <Badge color={a.tipo === 'transferencia' ? 'blue' : 'orange'}>{a.tipo}</Badge>
                {a.descripcion && <span className="text-xs text-surface-500">{a.descripcion}</span>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {a.comprobante_url && (
                <a href={a.comprobante_url} target="_blank" rel="noopener noreferrer" className="text-surface-500 hover:text-brand-400 transition-colors">
                  <Image size={16} />
                </a>
              )}
              <span className="font-mono font-semibold text-blue-400">{formatCOP(a.monto)}</span>
              <Button size="sm" variant="danger" onClick={() => remove.mutateAsync(a.id)}><Trash2 size={14} /></Button>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Registrar Adelanto">
        <div className="space-y-4">
          <Select label="Conductor *" value={form.conductor_id} onChange={e => setForm(f => ({ ...f, conductor_id: e.target.value }))}>
            <option value="">Seleccionar...</option>
            {conductores.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </Select>
          <Input label="Monto ($) *" type="number" value={form.monto} onChange={e => setForm(f => ({ ...f, monto: e.target.value }))} />
          <Input label="Fecha" type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} />
          <Select label="Tipo" value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
            <option value="transferencia">Transferencia</option>
            <option value="efectivo">Efectivo</option>
          </Select>
          <Input label="Descripción" value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Mes descuento" value={form.mes_descuento} onChange={e => setForm(f => ({ ...f, mes_descuento: +e.target.value }))}>
              {Array.from({ length: 12 }, (_, i) => <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('es', { month: 'long' })}</option>)}
            </Select>
            <Input label="Año" type="number" value={form.año_descuento} onChange={e => setForm(f => ({ ...f, año_descuento: +e.target.value }))} />
          </div>
          <div>
            <label className="text-xs font-medium text-surface-400 block mb-1">Comprobante (opcional)</label>
            <label className="flex items-center gap-2 p-3 bg-surface-800 border border-surface-700 rounded-lg cursor-pointer hover:border-brand-500/40 transition-colors">
              <Upload size={16} className="text-surface-400" />
              <span className="text-sm text-surface-400">{file ? file.name : 'Subir imagen o PDF'}</span>
              <input type="file" accept="image/*,application/pdf" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <Button className="flex-1" onClick={async () => {
              await create.mutateAsync({ form, file })
              setModal(false)
              setFile(null)
            }} disabled={!form.conductor_id || !form.monto}>Registrar adelanto</Button>
            <Button variant="secondary" onClick={() => setModal(false)}>Cancelar</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}