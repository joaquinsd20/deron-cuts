export const CURRENCY = 'S/ '

export const DAY_LABELS_ES = {
  LUNES: 'Lunes',
  MARTES: 'Martes',
  MIERCOLES: 'Miércoles',
  JUEVES: 'Jueves',
  VIERNES: 'Viernes',
  SABADO: 'Sábado',
  DOMINGO: 'Domingo'
}

export const WEEK_ORDER = [
  'LUNES',
  'MARTES',
  'MIERCOLES',
  'JUEVES',
  'VIERNES',
  'SABADO',
  'DOMINGO'
]

export const ES_MONTHS = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic'
]

export const ES_DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export const JS_DAY_TO_KEY = [
  'DOMINGO',
  'LUNES',
  'MARTES',
  'MIERCOLES',
  'JUEVES',
  'VIERNES',
  'SABADO'
]

export function dayKey(date) {
  return JS_DAY_TO_KEY[date.getDay()]
}

export function formatCurrency(value) {
  if (value === null || value === undefined) return `${CURRENCY}0.00`
  return `${CURRENCY}${Number(value).toFixed(2)}`
}

export function formatFechaLarga(fecha) {
  const d = new Date(fecha)
  return `${ES_DAYS[d.getDay()]} ${d.getDate()} ${ES_MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

export function toInputDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function addDays(date, days) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export function buildWhatsappLink(telefono, texto) {
  const clean = String(telefono || '').replace(/[^0-9]/g, '')
  if (!clean) return null
  return `https://wa.me/${clean}?text=${encodeURIComponent(texto)}`
}