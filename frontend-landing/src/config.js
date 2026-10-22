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
  const valor =
    typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha)
      ? `${fecha}T00:00:00`
      : fecha
  const d = new Date(valor)
  return `${ES_DAYS[d.getDay()]} ${d.getDate()} ${ES_MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

export function esSemanaDeCumpleanos(fechaNacimiento, fechaCita) {
  if (!fechaNacimiento || !fechaCita) return false
  const [anioNac, mesNac, diaNac] = String(fechaNacimiento)
    .slice(0, 10)
    .split('-')
    .map(Number)
  const [anioCita, mesCita, diaCita] = String(fechaCita)
    .slice(0, 10)
    .split('-')
    .map(Number)
  if (!anioNac || !mesNac || !diaNac || !anioCita || !mesCita || !diaCita) return false

  const cita = new Date(anioCita, mesCita - 1, diaCita)
  const lunesDe = (fecha) => {
    const copia = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate())
    copia.setDate(copia.getDate() - ((copia.getDay() + 6) % 7))
    return copia
  }

  return [anioCita - 1, anioCita].some((anio) => {
    let cumple = new Date(anio, mesNac - 1, diaNac)
    if (cumple.getMonth() !== mesNac - 1) {
      cumple = new Date(anio, 1, 28)
    }
    const lunes = lunesDe(cumple)
    const domingo = addDays(lunes, 6)
    return cita >= lunes && cita <= domingo
  })
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