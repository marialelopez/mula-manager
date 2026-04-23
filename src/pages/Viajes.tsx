import { useState } from 'react'
import { useViajes, useCreateViaje, useUpdateViaje } from '../hooks/useViajes'
import { useMulas } from '../hooks/useMulas'
import { useConductores } from '../hooks/useConductores'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Card } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Badge, { ESTADO_VIAJE } from '../components/ui/Badge'
import { Input, Select } from '../components/ui/Input'
import { Plus, MapPin, Truck, ChevronRight } from 'lucide-react'
import { formatCOP, formatDate } from '../lib/utils'

interface ViajeForm {
  mula_id: string
  conductor_id: string
  empresa_id: string
  fecha_salida: string
  fecha_llegada: string
  origen: string
  destino: string
  tipo_carga: string
  numero_remision: string
  valor_flete: number
  anticipo: number
  estado: string
  fecha_pago: string
}

const hoy = new Date().toISOString().split('T')[0]

const EMPTY: ViajeForm = {
  mula_id: '', conductor_id: '', empresa_id: '',
  fecha_salida: hoy, fecha_llegada: '',
  origen: '', destino: '', tipo_carga: 'cemento',
  numero_remision: '', valor_flete: 0, anticipo: 500000,
  estado: 'en_ruta', fecha_pago: '',
}

export default function Viajes() {
  const { data: viajes = [], isLoading } = useViajes()
  const { data: mulas = [] }             = useMulas()
  const { data: conductores = [] }       = useConductores()

  const { data: empresas = [] } = useQuery({
    queryKey: ['empresas'],
    queryFn: async () => {
      const { data } = await supabase.from('empresas').select('*')
      return data ?? []
    },
  })

  const create = useCreateViaje()
  const update = useUpdateViaje()

  const [modal, setModal]   = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm]     = useState<ViajeForm>(EMPTY)

  const openCreate = () => { setEditId(null); setForm({ ...EMPTY, fecha_salida: new Date().toISOString().split('T')[0] }); setModal(true) }

  const openEdit = (v: any) => {
    setEditId(v.id)
    setForm({
      mula_id:         v.mula_id ?? '',
      conductor_id:    v.conductor_id ?? '',
      empresa_id:      v.empresa_id ?? '',
      fecha_salida:    v.fecha_salida ?? hoy,
      fecha_llegada:   v.fecha_llegada ?? '',
      origen:          v.origen ?? '',
      destino:         v.destino ?? '',
      tipo_carga:      v.tipo_carga ?? 'cemento',
      numero_remision: v.numero_remision ?? '',
      valor_flete:     v.valor_flete ?? 0,
      anticipo:        v.anticipo ?? 500000,
      estado:          v.estado ?? 'en_ruta',
      fecha_pago:      v.fecha_pago ?? '',
    })
    setModal(true)
  }

  const handleSubmit = async () => {
    const payload: any = {
      ...form,
      empresa_id:    form.empresa_id    || null,
      fecha_llegada: form.fecha_llegada || null,
      numero_remision: form.numero_remision || null,
      fecha_pago:    form.fecha_pago    || null,
    }
    if (editId) await update.mutateAsync({ id: editId, ...payload })
    else        await create.mutateAsync(payload)
    setModal(false)
  }

  const setField = (field: keyof ViajeForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-surface-400 text-sm">{viajes.length} viajes</p>
        <Button onClick={openCreate}><Plus size={16} /> Nuevo Viaje</Button>
      </div>

      {isLoading ? (
        <p className="text-surface-500">Cargando...</p>
      ) : (
        <div className="space-y-3">
          {viajes.map((v: any) => {
            const estado      = ESTADO_VIAJE[v.estado] ?? { label: v.estado, color: 'gray' }
            const totalGastos = (v.gastos ?? []).reduce((s: number, g: any) => s + (g.monto ?? 0), 0)
            return (
              <Card key={v.id} className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge color={estado.color as any}>{estado.label}</Badge>
                    <span className="text-xs text-surface-500">{formatDate(v.fecha_salida)}</span>
                    {v.empresas && <span className="text-xs text-surface-500">{v.empresas.nombre}</span>}
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <Truck size={14} className="text-brand-400 flex-shrink-0" />
                    <span className="text-sm font-medium text-surface-200">{v.mulas?.placa}</span>
                    <span className="text-surface-600">·</span>
                    <span className="text-sm text-surface-400">{v.conductores?.nombre}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-surface-400">
                    <MapPin size={13} />
                    <span>{v.origen}</span>
                    <ChevronRight size={13} />
                    <span>{v.destino}</span>
                    {v.tipo_carga && <Badge color="gray">{v.tipo_carga}</Badge>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-mono font-semibold text-green-400">{formatCOP(v.valor_flete ?? 0)}</p>
                  <p className="text-xs text-surface-500">Anticipo: {formatCOP(v.anticipo ?? 0)}</p>
                  {totalGastos > 0 && (
                    <p className="text-xs text-red-400">Gastos: {formatCOP(totalGastos)}</p>
                  )}
                </div>
                <Button size="sm" variant="secondary" onClick={() => openEdit(v)}>Editar</Button>
              </Card>
            )
          })}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Editar Viaje' : 'Nuevo Viaje'} size="lg">
        <div className="grid grid-cols-2 gap-4">
  <Select label="Mula *" value={form.mula_id} onChange={setField('mula_id')}>
    <option value="">Seleccionar...</option>
    {mulas.map(m => <option key={m.id} value={m.id}>{m.placa}</option>)}
  </Select>
  <Select label="Conductor *" value={form.conductor_id} onChange={setField('conductor_id')}>
    <option value="">Seleccionar...</option>
    {conductores.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
  </Select>
  <Select label="Empresa" value={form.empresa_id} onChange={setField('empresa_id')}>
    <option value="">Sin empresa</option>
    {(empresas as any[]).map((e: any) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
  </Select>
  <Select label="Tipo de carga" value={form.tipo_carga} onChange={setField('tipo_carga')}>
    <option value="cemento">Cemento</option>
    <option value="madera">Madera</option>
    <option value="otro">Otro</option>
  </Select>
  <Input label="Origen *" value={form.origen} onChange={setField('origen')} />
  <Input label="Destino *" value={form.destino} onChange={setField('destino')} />
  <Input label="Valor flete ($)" type="number" value={form.valor_flete} onChange={e => setForm(f => ({ ...f, valor_flete: +e.target.value }))} />
  <Input label="Anticipo ($)" type="number" value={form.anticipo} onChange={e => setForm(f => ({ ...f, anticipo: +e.target.value }))} />
  <Input label="N° Remisión" value={form.numero_remision} onChange={setField('numero_remision')} />
  <Select label="Estado" value={form.estado} onChange={setField('estado')}>
    <option value="en_ruta">En ruta</option>
    <option value="completado">Completado</option>
    <option value="pendiente_remision">Pendiente remisión</option>
    <option value="pagado">Pagado</option>
  </Select>
  {form.estado === 'pagado' && (
    <Input label="Fecha pago" type="date" value={form.fecha_pago} onChange={setField('fecha_pago')} />
  )}
</div>
<div className="flex gap-3 mt-4">
  <Button
    className="flex-1"
    onClick={handleSubmit}
    disabled={!form.mula_id || !form.conductor_id || !form.origen || !form.destino}
  >
    {editId ? 'Guardar cambios' : 'Crear viaje'}
  </Button>
  <Button variant="secondary" onClick={() => setModal(false)}>Cancelar</Button>
</div>
      </Modal>
    </div>
  )
}