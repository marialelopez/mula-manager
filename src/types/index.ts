export interface Mula {
  id: string
  placa: string
  marca?: string
  modelo?: string
  año?: number
  color?: string
  activa: boolean
  saldo_colpass: number
  notas?: string
  created_at: string
  updated_at: string
  conductores?: Conductor[]
}

export interface Conductor {
  id: string
  nombre: string
  cedula: string
  telefono?: string
  email?: string
  mula_id?: string
  fecha_inicio?: string
  dia_pago_seguridad_social: number
  activo: boolean
  notas?: string
  created_at: string
  mulas?: Mula
}

export interface TipoGasto {
  id: string
  nombre: string
  categoria: 'conductor' | 'mula' | 'general'
  activo: boolean
}

export interface Empresa {
  id: string
  nombre: string
  nit?: string
}

export interface Viaje {
  id: string
  mula_id: string
  conductor_id: string
  empresa_id?: string
  fecha_salida: string
  fecha_llegada?: string
  origen: string
  destino: string
  tipo_carga: 'cemento' | 'madera' | 'otro'
  numero_remision?: string
  valor_flete: number
  anticipo: number
  estado: 'en_ruta' | 'completado' | 'pendiente_remision' | 'pagado'
  fecha_pago?: string
  notas?: string
  created_at: string
  mulas?: Mula
  conductores?: Conductor
  empresas?: Empresa
  gastos?: Gasto[]
}

export interface Gasto {
  id: string
  viaje_id?: string
  mula_id?: string
  conductor_id?: string
  tipo_gasto_id: string
  monto: number
  descripcion?: string
  fecha: string
  tipos_gasto?: TipoGasto
  viajes?: Viaje
  mulas?: Mula
  conductores?: Conductor
}

export interface Tanqueo {
  id: string
  mula_id: string
  fecha: string
  litros?: number
  valor_total: number
  estacion?: string
  kilometraje?: number
  notas?: string
  mulas?: Mula
}

export interface RecargaColpass {
  id: string
  mula_id: string
  fecha: string
  monto: number
  saldo_anterior?: number
  saldo_posterior?: number
  notas?: string
  mulas?: Mula
}

export interface PeajeUsado {
  id: string
  mula_id: string
  viaje_id?: string
  fecha: string
  nombre_peaje?: string
  valor: number
  mulas?: Mula
}

export interface Adelanto {
  id: string
  conductor_id: string
  fecha: string
  monto: number
  tipo: 'transferencia' | 'efectivo'
  comprobante_url?: string
  descripcion?: string
  mes_descuento?: number
  año_descuento?: number
  conductores?: Conductor
}

export interface PagoSeguridadSocial {
  id: string
  conductor_id: string
  mes: number
  año: number
  fecha_pago?: string
  monto?: number
  estado: 'pendiente' | 'pagado'
  comprobante_url?: string
  conductores?: Conductor
}

export interface Mantenimiento {
  id: string
  mula_id: string
  tipo: string
  fecha: string
  kilometraje?: number
  costo?: number
  descripcion?: string
  taller?: string
  proxima_revision?: string
  mulas?: Mula
}

export interface Configuracion {
  id: string
  clave: string
  valor: string
  descripcion?: string
}