import { format, differenceInDays, startOfMonth, endOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'

export const formatCOP = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value)

export const formatDate = (date: string | Date) =>
  format(new Date(date), 'dd MMM yyyy', { locale: es })

export const formatDateShort = (date: string | Date) =>
  format(new Date(date), 'dd/MM/yyyy')

export const diasParaFecha = (dia: number): number => {
  const hoy = new Date()
  const fechaPago = new Date(hoy.getFullYear(), hoy.getMonth(), dia)
  if (fechaPago < hoy) {
    fechaPago.setMonth(fechaPago.getMonth() + 1)
  }
  return differenceInDays(fechaPago, hoy)
}

export const mesActual = () => {
  const hoy = new Date()
  return { mes: hoy.getMonth() + 1, año: hoy.getFullYear() }
}

export const rangoMesActual = () => {
  const hoy = new Date()
  return {
    inicio: format(startOfMonth(hoy), 'yyyy-MM-dd'),
    fin: format(endOfMonth(hoy), 'yyyy-MM-dd'),
  }
}

export const cn = (...classes: (string | undefined | false | null)[]): string =>
  classes.filter(Boolean).join(' ')