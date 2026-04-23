import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useMulas } from '../hooks/useMulas'
import { Card } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import { Input, Select } from '../components/ui/Input'
import { Plus, CreditCard, ArrowUpCircle, ArrowDownCircle, Trash2 } from 'lucide-react'
import { formatCOP, formatDate } from '../lib/utils'

export default function Peajes() {
  const { data: mulas = [] } = useMulas()
  const qc = useQueryClient()

  const { data: recargas = [] } = useQuery({
    queryKey: ['recargas_colpass'],
    queryFn: async () => {
      const { data } = await supabase.from('recargas_colpass').select('*, mulas(placa, saldo_colpass)').order('fecha', { ascending: false })
      return data || []
    }
  })

  const { data: peajesUsados = [] } = useQuery({
    queryKey: ['peajes_usados'],
    queryFn: async () => {
      const { data } = await supabase.from('peajes_usados').select('*, mulas(placa)').order('fecha', { ascending: false }).limit(30)
      return data || []
    }
  })

  const createRecarga = useMutation({
    mutationFn: async (r: any) => { await supabase.from('recargas_colpass').insert(r) },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['recargas_colpass'] }); qc.invalidateQueries({ queryKey: ['mulas'] }) }
  })
  const createPeaje = useMutation({
    mutationFn: async (p: any) => { await supabase.from('peajes_usados').insert(p) },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['peajes_usados'] }); qc.invalidateQueries({ queryKey: ['mulas'] }) }
  })

  const [recargaModal, setRecargaModal] = useState(false)
  const [peajeModal, setPeajeModal] = useState(false)
  const [rForm, setRForm] = useState({ mula_id: '', fecha: new Date().toISOString().split('T')[0], monto: '', notas: '' })
  const [pForm, setPForm] = useState({ mula_id: '', nombre_peaje: '', valor: '', fecha: new Date().toISOString().split('T')[0] })

  return (
    <div className="space-y-6">
      {/* Saldos por mula */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mulas.filter(m => m.activa).map(m => (
          <Card key={m.id} className="flex items-center gap-4">
            <div className="p-3 bg-brand-500/20 rounded-xl">
              <CreditCard size={20} className="text-brand-400" />
            </div>
            <div className="flex-1">
              <p className="font-display font-semibold text-surface-100">{m.placa}</p>
              <p className="text-xs text-surface-500">Saldo Colpass</p>
            </div>
            <span className={`font-mono font-bold text-lg ${m.saldo_colpass < 50000 ? 'text-red-400' : 'text-green-400'}`}>
              {formatCOP(m.saldo_colpass)}
            </span>
          </Card>
        ))}
      </div>

      <div className="flex gap-3">
        <Button onClick={() => setRecargaModal(true)}><ArrowUpCircle size={16} /> Recargar Colpass</Button>
        <Button variant="secondary" onClick={() => setPeajeModal(true)}><ArrowDownCircle size={16} /> Registrar Peaje</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-display font-semibold text-surface-300 mb-3">Recargas recientes</h3>
          <div className="space-y-2">
            {(recargas as any[]).slice(0, 10).map((r: any) => (
              <div key={r.id} className="flex items-center gap-3 p-3 bg-surface-800 rounded-lg">
                <ArrowUpCircle size={16} className="text-green-400 flex-shrink-0" />
                <div className="flex-1 text-sm">
                  <span className="text-surface-200">{r.mulas?.placa}</span>
                  <span className="text-surface-500 ml-2">{formatDate(r.fecha)}</span>
                </div>
                <span className="font-mono text-green-400 text-sm">+{formatCOP(r.monto)}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-display font-semibold text-surface-300 mb-3">Peajes recientes</h3>
          <div className="space-y-2">
            {(peajesUsados as any[]).slice(0, 10).map((p: any) => (
              <div key={p.id} className="flex items-center gap-3 p-3 bg-surface-800 rounded-lg">
                <ArrowDownCircle size={16} className="text-red-400 flex-shrink-0" />
                <div className="flex-1 text-sm">
                  <span className="text-surface-200">{p.mulas?.placa}</span>
                  {p.nombre_peaje && <span className="text-surface-500 ml-2">{p.nombre_peaje}</span>}
                </div>
                <span className="font-mono text-red-400 text-sm">-{formatCOP(p.valor)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal open={recargaModal} onClose={() => setRecargaModal(false)} title="Recargar Colpass">
        <div className="space-y-4">
          <Select label="Mula *" value={rForm.mula_id} onChange={e => setRForm(f => ({ ...f, mula_id: e.target.value }))}>
            <option value="">Seleccionar...</option>
            {mulas.map(m => <option key={m.id} value={m.id}>{m.placa} (saldo: {formatCOP(m.saldo_colpass)})</option>)}
          </Select>
          <Input label="Monto ($) *" type="number" value={rForm.monto} onChange={e => setRForm(f => ({ ...f, monto: e.target.value }))} />
          <Input label="Fecha" type="date" value={rForm.fecha} onChange={e => setRForm(f => ({ ...f, fecha: e.target.value }))} />
          <Input label="Notas" value={rForm.notas} onChange={e => setRForm(f => ({ ...f, notas: e.target.value }))} />
          <Button className="w-full" onClick={async () => {
            await createRecarga.mutateAsync({ ...rForm, monto: +rForm.monto })
            setRecargaModal(false)
          }} disabled={!rForm.mula_id || !rForm.monto}>Registrar recarga</Button>
        </div>
      </Modal>

      <Modal open={peajeModal} onClose={() => setPeajeModal(false)} title="Registrar Peaje Usado">
        <div className="space-y-4">
          <Select label="Mula *" value={pForm.mula_id} onChange={e => setPForm(f => ({ ...f, mula_id: e.target.value }))}>
            <option value="">Seleccionar...</option>
            {mulas.map(m => <option key={m.id} value={m.id}>{m.placa}</option>)}
          </Select>
          <Input label="Nombre del peaje" value={pForm.nombre_peaje} onChange={e => setPForm(f => ({ ...f, nombre_peaje: e.target.value }))} />
          <Input label="Valor ($) *" type="number" value={pForm.valor} onChange={e => setPForm(f => ({ ...f, valor: e.target.value }))} />
          <Input label="Fecha" type="date" value={pForm.fecha} onChange={e => setPForm(f => ({ ...f, fecha: e.target.value }))} />
          <Button className="w-full" onClick={async () => {
            await createPeaje.mutateAsync({ ...pForm, valor: +pForm.valor })
            setPeajeModal(false)
          }} disabled={!pForm.mula_id || !pForm.valor}>Registrar peaje</Button>
        </div>
      </Modal>
    </div>
  )
}