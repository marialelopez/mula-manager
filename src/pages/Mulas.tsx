import { useState } from 'react'
import { useMulas, useCreateMula, useUpdateMula, useDeleteMula } from '../hooks/useMulas'
import { Card } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Badge from '../components/ui/Badge'
import { Input } from '../components/ui/Input'
import { Plus, Truck, Edit2, Trash2, CreditCard } from 'lucide-react'
import { formatCOP } from '../lib/utils'

interface MulaForm {
  placa: string
  activa: boolean
  saldo_colpass: number
  notas: string
}

const EMPTY: MulaForm = {
  placa: '', activa: true, saldo_colpass: 0, notas: '',
}

export default function Mulas() {
  const { data: mulas = [], isLoading } = useMulas()
  const create = useCreateMula()
  const update = useUpdateMula()
  const remove = useDeleteMula()

  const [modal, setModal]   = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm]     = useState<MulaForm>(EMPTY)

  const openCreate = () => {
    setEditId(null)
    setForm(EMPTY)
    setModal(true)
  }

  const openEdit = (m: any) => {
    setEditId(m.id)
    setForm({
      placa: m.placa,
      activa: m.activa,
      saldo_colpass: m.saldo_colpass,
      notas: m.notas ?? '',
    })
    setModal(true)
  }

  const handleSubmit = async () => {
    if (editId) {
      await update.mutateAsync({ id: editId, ...form })
    } else {
      await create.mutateAsync(form as any)
    }
    setModal(false)
  }

  const setField = (field: keyof MulaForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-surface-400 text-sm">{mulas.length} mulas registradas</p>
        <Button onClick={openCreate}><Plus size={16} /> Nueva Mula</Button>
      </div>

      {isLoading ? (
        <p className="text-surface-500">Cargando...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mulas.map(m => (
            <Card key={m.id} className="flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-500/20 rounded-xl flex items-center justify-center">
                    <Truck size={20} className="text-brand-400" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg text-surface-50">{m.placa}</h3>
                  </div>
                </div>
                <Badge color={m.activa ? 'green' : 'gray'}>{m.activa ? 'Activa' : 'Inactiva'}</Badge>
              </div>

              <div className="flex items-center gap-2 bg-surface-800 rounded-lg p-3">
                <CreditCard size={16} className="text-surface-400" />
                <span className="text-sm text-surface-400">Saldo Colpass:</span>
                <span className={`text-sm font-mono font-semibold ${m.saldo_colpass < 50000 ? 'text-red-400' : 'text-green-400'}`}>
                  {formatCOP(m.saldo_colpass)}
                </span>
              </div>

              {(m as any).conductores?.[0] && (
                <p className="text-xs text-surface-500">
                  Conductor: <span className="text-surface-300">{(m as any).conductores[0].nombre}</span>
                </p>
              )}

              <div className="flex gap-2 pt-2 border-t border-surface-800">
                <Button size="sm" variant="secondary" onClick={() => openEdit(m)}>
                  <Edit2 size={14} /> Editar
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => remove.mutateAsync(m.id)}
                  disabled={remove.isPending}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Editar Mula' : 'Nueva Mula'}>
        <div className="space-y-4">
          <Input
            label="Placa *"
            value={form.placa}
            onChange={e => setForm(f => ({ ...f, placa: e.target.value.toUpperCase() }))}
            placeholder="SOS420"
          />
          <Input
            label="Saldo Colpass inicial"
            type="number"
            value={form.saldo_colpass}
            onChange={e => setForm(f => ({ ...f, saldo_colpass: +e.target.value }))}
          />
          <Input label="Notas" value={form.notas} onChange={setField('notas')} />
          <label className="flex items-center gap-2 text-sm text-surface-300 cursor-pointer">
            <input
              type="checkbox"
              checked={form.activa}
              onChange={e => setForm(f => ({ ...f, activa: e.target.checked }))}
              className="accent-brand-500 w-4 h-4"
            />
            Mula activa
          </label>
          <div className="flex gap-3 pt-2">
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={!form.placa || create.isPending || update.isPending}
            >
              {editId ? 'Guardar cambios' : 'Crear mula'}
            </Button>
            <Button variant="secondary" onClick={() => setModal(false)}>Cancelar</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}