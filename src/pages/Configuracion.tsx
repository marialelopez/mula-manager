import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Card, CardTitle } from '../components/ui/Card'
import Button from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Settings, Save, CheckCircle } from 'lucide-react'
import { formatCOP } from '../lib/utils'

export default function Configuracion() {
  const qc = useQueryClient()
  const [saved, setSaved] = useState(false)
  const [form, setForm]   = useState<Record<string, string>>({})

  const { data: config, isLoading } = useQuery({
    queryKey: ['config'],
    queryFn: async () => {
      const { data, error } = await supabase.from('configuracion').select('*')
      if (error) throw error
      const map: Record<string, string> = {}
      ;(data ?? []).forEach(c => { map[c.clave] = c.valor })
      return map
    },
  })

  const save = useMutation({
    mutationFn: async () => {
      for (const [clave, valor] of Object.entries(form)) {
        const { error } = await supabase
          .from('configuracion')
          .update({ valor, updated_at: new Date().toISOString() })
          .eq('clave', clave)
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['config'] })
      setSaved(true)
      setForm({})
      setTimeout(() => setSaved(false), 2500)
    },
  })

  if (isLoading) return <p className="text-surface-500 text-sm">Cargando configuración...</p>

  const values = { ...config, ...form }

  const FIELDS = [
    {
      key: 'sueldo_base',
      label: 'Sueldo base mensual del conductor ($)',
      type: 'number',
      hint: `Actualmente: ${formatCOP(+(values.sueldo_base ?? 0))}`,
    },
    {
      key: 'porcentaje_comision',
      label: 'Porcentaje de comisión por viaje (%)',
      type: 'number',
      hint: `Actualmente: ${values.porcentaje_comision ?? 0}%`,
    },
    {
      key: 'anticipo_default',
      label: 'Anticipo predeterminado por viaje ($)',
      type: 'number',
      hint: `Actualmente: ${formatCOP(+(values.anticipo_default ?? 0))}`,
    },
    {
      key: 'dias_alerta_seguridad_social',
      label: 'Días de anticipación para alerta de seguridad social',
      type: 'number',
      hint: `Actualmente: ${values.dias_alerta_seguridad_social ?? 5} días`,
    },
  ]

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardTitle>
          <span className="flex items-center gap-2">
            <Settings size={18} className="text-brand-400" />
            Configuración de pagos
          </span>
        </CardTitle>
        <div className="space-y-5">
          {FIELDS.map(field => (
            <div key={field.key}>
              <Input
                label={field.label}
                type={field.type}
                value={values[field.key] ?? ''}
                onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
              />
              <p className="text-xs text-surface-500 mt-1">{field.hint}</p>
            </div>
          ))}

          <Button
            onClick={() => save.mutateAsync()}
            disabled={Object.keys(form).length === 0 || save.isPending}
          >
            {saved
              ? <><CheckCircle size={16} /> Guardado</>
              : <><Save size={16} /> Guardar cambios</>
            }
          </Button>
        </div>
      </Card>
    </div>
  )
}