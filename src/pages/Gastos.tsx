import { useState } from 'react'
import { useGastos, useTiposGasto, useCreateGasto } from '../hooks/useGastos'
import { useViajes } from '../hooks/useViajes'
import { useMulas } from '../hooks/useMulas'
// Quita las llaves { } de la línea 5
import { useConductores } from '../hooks/useConductores'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Card } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Badge from '../components/ui/Badge'
import { Input, Select } from '../components/ui/Input'
import { Plus, Trash2, Tag } from 'lucide-react'
import { formatCOP, formatDate } from '../lib/utils'

interface GastoForm {
  tipo_gasto_id: string
  monto: string
  descripcion: string
  fecha: string
  viaje_id: string
  mula_id: string
  conductor_id: string
}

const EMPTY: GastoForm = {
  tipo_gasto_id: '', monto: '', descripcion: '',
  fecha: new Date().toISOString().split('T')[0],
  viaje_id: '', mula_id: '', conductor_id: '',
}

export default function Gastos() {
  const { data: gastos = [] }      = useGastos()
  const { data: tipos = [] }       = useTiposGasto()
  const { data: viajes = [] }      = useViajes()
  const { data: mulas = [] }       = useMulas()
  const { data: conductores = [] } = useConductores()
  const create = useCreateGasto()
  const qc = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('gastos').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gastos'] }),
  })

  const crearTipoMutation = useMutation({
    mutationFn: async (tipo: { nombre: string; categoria: string }) => {
      const { error } = await supabase.from('tipos_gasto').insert(tipo)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tipos_gasto'] }),
  })

  const [modal, setModal]           = useState(false)
  const [tiposModal, setTiposModal] = useState(false)
  const [form, setForm]             = useState<GastoForm>(EMPTY)
  const [nuevoTipo, setNuevoTipo]   = useState({ nombre: '', categoria: 'conductor' })

  const handleSubmit = async () => {
    await create.mutateAsync({
      tipo_gasto_id: form.tipo_gasto_id,
      monto:         +form.monto,
      descripcion:   form.descripcion || undefined,
      fecha:         form.fecha,
      viaje_id:      form.viaje_id      || null,
      mula_id:       form.mula_id       || null,
      conductor_id:  form.conductor_id  || null,
    } as any)
    setModal(false)
    setForm(EMPTY)
  }

  const totalMes = (gastos as any[]).reduce((s, g) => s + (g.monto ?? 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-surface-400 text-sm">
          {gastos.length} gastos · Total:{' '}
          <span className="text-red-400 font-mono">{formatCOP(totalMes)}</span>
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setTiposModal(true)}>
            <Tag size={16} /> Tipos
          </Button>
          <Button onClick={() => { setForm(EMPTY); setModal(true) }}>
            <Plus size={16} /> Nuevo Gasto
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {(gastos as any[]).map((g: any) => (
          <Card key={g.id} className="flex items-center gap-4 py-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge
                  color={
                    g.tipos_gasto?.categoria === 'conductor' ? 'blue' :
                    g.tipos_gasto?.categoria === 'mula'      ? 'orange' : 'gray'
                  }
                >
                  {g.tipos_gasto?.nombre ?? 'Sin tipo'}
                </Badge>
                <span className="text-xs text-surface-500">{formatDate(g.fecha)}</span>
              </div>
              <p className="text-xs text-surface-500">
                {g.mulas?.placa      && `Mula: ${g.mulas.placa}`}
                {g.conductores?.nombre && ` · ${g.conductores.nombre}`}
                {g.descripcion       && ` · ${g.descripcion}`}
              </p>
            </div>
            <span className="font-mono font-semibold text-red-400">{formatCOP(g.monto)}</span>
            <Button
              size="sm"
              variant="danger"
              onClick={() => deleteMutation.mutateAsync(g.id)}
              disabled={deleteMutation.isPending}
            >
              <Trash2 size={14} />
            </Button>
          </Card>
        ))}
      </div>

      {/* Modal nuevo gasto */}
      <Modal open={modal} onClose={() => setModal(false)} title="Nuevo Gasto">
        <div className="space-y-4">
          <Select
            label="Tipo de gasto *"
            value={form.tipo_gasto_id}
            onChange={e => setForm(f => ({ ...f, tipo_gasto_id: e.target.value }))}
          >
            <option value="">Seleccionar...</option>
            {tipos.map(t => (
              <option key={t.id} value={t.id}>{t.nombre} ({t.categoria})</option>
            ))}
          </Select>
          <Input
            label="Monto ($) *"
            type="number"
            value={form.monto}
            onChange={e => setForm(f => ({ ...f, monto: e.target.value }))}
          />
          <Input
            label="Fecha"
            type="date"
            value={form.fecha}
            onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
          />
          <Select
            label="Viaje relacionado"
            value={form.viaje_id}
            onChange={e => setForm(f => ({ ...f, viaje_id: e.target.value }))}
          >
            <option value="">Sin viaje</option>
            {(viajes as any[]).map((v: any) => (
              <option key={v.id} value={v.id}>
                {v.mulas?.placa} · {v.origen}→{v.destino} ({v.fecha_salida})
              </option>
            ))}
          </Select>
          <Select
            label="Mula"
            value={form.mula_id}
            onChange={e => setForm(f => ({ ...f, mula_id: e.target.value }))}
          >
            <option value="">Ninguna</option>
            {mulas.map(m => <option key={m.id} value={m.id}>{m.placa}</option>)}
          </Select>
          <Select
            label="Conductor"
            value={form.conductor_id}
            onChange={e => setForm(f => ({ ...f, conductor_id: e.target.value }))}
          >
            <option value="">Ninguno</option>
            {conductores.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </Select>
          <Input
            label="Descripción"
            value={form.descripcion}
            onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
          />
          <div className="flex gap-3 pt-2">
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={!form.tipo_gasto_id || !form.monto || create.isPending}
            >
              Registrar gasto
            </Button>
            <Button variant="secondary" onClick={() => setModal(false)}>Cancelar</Button>
          </div>
        </div>
      </Modal>

      {/* Modal tipos de gasto */}
      <Modal open={tiposModal} onClose={() => setTiposModal(false)} title="Tipos de Gasto">
        <div className="space-y-4">
          <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin">
            {tipos.map(t => (
              <div key={t.id} className="flex items-center justify-between p-3 bg-surface-800 rounded-lg">
                <span className="text-sm text-surface-200">{t.nombre}</span>
                <Badge color={t.categoria === 'conductor' ? 'blue' : t.categoria === 'mula' ? 'orange' : 'gray'}>
                  {t.categoria}
                </Badge>
              </div>
            ))}
          </div>
          <div className="border-t border-surface-800 pt-4 space-y-3">
            <p className="text-sm font-medium text-surface-300">Agregar nuevo tipo</p>
            <Input
              label="Nombre"
              value={nuevoTipo.nombre}
              onChange={e => setNuevoTipo(n => ({ ...n, nombre: e.target.value }))}
            />
            <Select
              label="Categoría"
              value={nuevoTipo.categoria}
              onChange={e => setNuevoTipo(n => ({ ...n, categoria: e.target.value }))}
            >
              <option value="conductor">Conductor</option>
              <option value="mula">Mula</option>
              <option value="general">General</option>
            </Select>
            <Button
              onClick={async () => {
                await crearTipoMutation.mutateAsync(nuevoTipo)
                setNuevoTipo({ nombre: '', categoria: 'conductor' })
              }}
              disabled={!nuevoTipo.nombre || crearTipoMutation.isPending}
            >
              <Plus size={16} /> Agregar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}