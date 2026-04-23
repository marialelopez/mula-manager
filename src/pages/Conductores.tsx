import { useState } from 'react'
import { useConductores, useCreateConductor, useUpdateConductor } from '../hooks/useConductores'
import { useMulas } from '../hooks/useMulas'
import { Card } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Badge from '../components/ui/Badge'
import { Input, Select } from '../components/ui/Input'
import { Plus, User, Phone, Edit2, Truck, Shield } from 'lucide-react'
import { diasParaFecha } from '../lib/utils'

interface ConductorForm {
  nombre: string
  cedula: string
  telefono: string
  email: string
  mula_id: string | null
  fecha_inicio: string
  dia_pago_seguridad_social: number
  activo: boolean
  notas: string
}

const EMPTY: ConductorForm = {
  nombre: '', cedula: '', telefono: '', email: '',
  mula_id: null, fecha_inicio: '', dia_pago_seguridad_social: 1,
  activo: true, notas: '',
}

export default function Conductores() {
  const { data: conductores = [], isLoading } = useConductores()
  const { data: mulas = [] } = useMulas()
  const create = useCreateConductor()
  const update = useUpdateConductor()

  const [modal, setModal]   = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm]     = useState<ConductorForm>(EMPTY)

  const openCreate = () => { setEditId(null); setForm(EMPTY); setModal(true) }

  const openEdit = (c: any) => {
    setEditId(c.id)
    setForm({
      nombre: c.nombre, cedula: c.cedula, telefono: c.telefono ?? '',
      email: c.email ?? '', mula_id: c.mula_id ?? null,
      fecha_inicio: c.fecha_inicio ?? '', dia_pago_seguridad_social: c.dia_pago_seguridad_social,
      activo: c.activo, notas: c.notas ?? '',
    })
    setModal(true)
  }

  const handleSubmit = async () => {
    const payload = { ...form, mula_id: form.mula_id || null }
    if (editId) await update.mutateAsync({ id: editId, ...payload })
    else        await create.mutateAsync(payload as any)
    setModal(false)
  }

  const setField = (field: keyof ConductorForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-surface-400 text-sm">{conductores.length} conductores</p>
        <Button onClick={openCreate}><Plus size={16} /> Nuevo Conductor</Button>
      </div>

      {isLoading ? (
        <p className="text-surface-500">Cargando...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {conductores.map(c => {
            const diasSS = diasParaFecha(c.dia_pago_seguridad_social)
            return (
              <Card key={c.id}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                      <User size={18} className="text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-surface-50">{c.nombre}</h3>
                      <p className="text-xs text-surface-500">CC: {c.cedula}</p>
                    </div>
                  </div>
                  <Badge color={c.activo ? 'green' : 'gray'}>{c.activo ? 'Activo' : 'Inactivo'}</Badge>
                </div>

                <div className="space-y-2 text-sm">
                  {c.telefono && (
                    <div className="flex items-center gap-2 text-surface-400">
                      <Phone size={14} /> {c.telefono}
                    </div>
                  )}
                  {(c as any).mulas && (
                    <div className="flex items-center gap-2 text-surface-400">
                      <Truck size={14} /> Mula: <span className="text-surface-200">{(c as any).mulas.placa}</span>
                    </div>
                  )}
                  <div className={`flex items-center gap-2 ${diasSS <= 2 ? 'text-red-400' : diasSS <= 5 ? 'text-yellow-400' : 'text-surface-400'}`}>
                    <Shield size={14} />
                    Seg. social día {c.dia_pago_seguridad_social}
                    {' · '}
                    {diasSS <= 0 ? '¡Vencida!' : `${diasSS}d restantes`}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-surface-800">
                  <Button size="sm" variant="secondary" onClick={() => openEdit(c)}>
                    <Edit2 size={14} /> Editar
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Editar Conductor' : 'Nuevo Conductor'}>
        <div className="space-y-4">
          <Input label="Nombre completo *" value={form.nombre} onChange={setField('nombre')} />
          <Input label="Cédula *" value={form.cedula} onChange={setField('cedula')} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Teléfono" value={form.telefono} onChange={setField('telefono')} />
            <Input label="Email" type="email" value={form.email} onChange={setField('email')} />
          </div>
          <Select
            label="Mula asignada"
            value={form.mula_id ?? ''}
            onChange={e => setForm(f => ({ ...f, mula_id: e.target.value || null }))}
          >
            <option value="">Sin asignar</option>
            {mulas.map(m => <option key={m.id} value={m.id}>{m.placa}</option>)}
          </Select>
          <Input
            label="Día pago seguridad social (1-28)"
            type="number"
            min={1}
            max={28}
            value={form.dia_pago_seguridad_social}
            onChange={e => setForm(f => ({ ...f, dia_pago_seguridad_social: +e.target.value }))}
          />
          <Input
            label="Fecha inicio"
            type="date"
            value={form.fecha_inicio}
            onChange={setField('fecha_inicio')}
          />
          <div className="flex gap-3 pt-2">
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={!form.nombre || !form.cedula || create.isPending || update.isPending}
            >
              {editId ? 'Guardar cambios' : 'Crear conductor'}
            </Button>
            <Button variant="secondary" onClick={() => setModal(false)}>Cancelar</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}