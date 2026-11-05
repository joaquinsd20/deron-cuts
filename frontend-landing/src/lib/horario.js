import { JS_DAY_TO_KEY, DAY_LABELS_ES } from '../config.js'

// La barbería opera en hora de Lima, aunque el visitante esté en otro huso.
function ahoraEnLima() {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Lima',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(new Date())
  const get = (t) => partes.find((p) => p.type === t)?.value
  const dias = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  const hora = Number(get('hour')) % 24
  return { dia: dias[get('weekday')], minutos: hora * 60 + Number(get('minute')) }
}

function aMinutos(hhmm) {
  const [h, m] = String(hhmm || '').split(':').map(Number)
  return Number.isFinite(h) ? h * 60 + (m || 0) : null
}

export function diaDeHoyKey() {
  return JS_DAY_TO_KEY[ahoraEnLima().dia]
}

/** { abierto, texto } a partir del horario configurado en el admin. */
export function estadoNegocio(horario) {
  if (!horario) return null
  const { dia, minutos } = ahoraEnLima()
  const hoy = horario[JS_DAY_TO_KEY[dia]]

  if (hoy?.activo) {
    const abre = aMinutos(hoy.abre)
    const cierra = aMinutos(hoy.cierra)
    if (abre !== null && cierra !== null) {
      if (minutos >= abre && minutos < cierra) {
        return { abierto: true, texto: `Abierto ahora · cierra ${hoy.cierra}` }
      }
      if (minutos < abre) {
        return { abierto: false, texto: `Cerrado · abre hoy a las ${hoy.abre}` }
      }
    }
  }

  for (let i = 1; i <= 7; i++) {
    const key = JS_DAY_TO_KEY[(dia + i) % 7]
    const d = horario[key]
    if (d?.activo && d.abre) {
      const cuando = i === 1 ? 'mañana' : `el ${DAY_LABELS_ES[key].toLowerCase()}`
      return { abierto: false, texto: `Cerrado · abre ${cuando} a las ${d.abre}` }
    }
  }
  return { abierto: false, texto: 'Cerrado por ahora' }
}
