/**
 * Lee el monto pagado en la captura de Yape/Plin con OCR (Tesseract.js, en el navegador).
 * Devuelve { estado, monto }:
 *   - 'ok'        → la captura muestra exactamente el monto esperado
 *   - 'distinto'  → se leyó un monto, pero no es el esperado (monto = lo leído)
 *   - 'ilegible'  → no se encontró ningún monto en la imagen
 *   - 'error'     → el lector no se pudo cargar (sin internet, navegador antiguo…)
 */

let workerPromesa = null

function obtenerWorker() {
  if (!workerPromesa) {
    workerPromesa = import('tesseract.js')
      .then(({ createWorker }) => createWorker('eng'))
      .catch((e) => {
        workerPromesa = null
        throw e
      })
  }
  return workerPromesa
}

/** Empieza a descargar el lector antes de que el cliente suba la foto. */
export function precargarLector() {
  obtenerWorker().catch(() => {})
}

const centimos = (n) => Math.round(Number(n) * 100)

/** Montos que aparecen junto a "S/" (el OCR a veces lee la S como s, 5 o $). */
export function montosDelTexto(texto) {
  const limpio = String(texto || '').replace(/[Oo](?=\d)|(?<=\d)[Oo]/g, '0')
  const conSimbolo = []
  // (?<!\d) evita tomar fechas como "15/11" por "5/ 11".
  const re = /(?<!\d)[S5$]\s*\/\s*\.?\s*(\d{1,4})(?:\s*[.,]\s*(\d{1,2})(?!\d)|\s+(\d{2})(?!\d))?/gi
  let m
  while ((m = re.exec(limpio))) {
    const dec = m[2] ?? m[3]
    conSimbolo.push(Number(`${m[1]}.${dec ? dec.padEnd(2, '0') : '00'}`))
  }
  if (conSimbolo.length) return conSimbolo
  // Sin "S/" legible: cualquier número con decimales (ej. 17.50).
  return [...limpio.matchAll(/(?<![\d.,/])(\d{1,4})[.,](\d{2})(?![\d/])/g)].map((x) => Number(`${x[1]}.${x[2]}`))
}

/**
 * En Yape/Plin el monto es el número más grande de la pantalla, con los céntimos
 * pequeños a su derecha. Se usa el tamaño de cada palabra que da el OCR.
 */
export function montoPorTamano(palabras) {
  const alto = (w) => w.bbox.y1 - w.bbox.y0
  const numeros = (palabras || []).filter((w) => /^\d{1,4}$/.test(w.text.replace(/^[^\d]+/, '')))
  if (!numeros.length) return null
  const grande = numeros.reduce((a, b) => (alto(b) > alto(a) ? b : a))
  const h = alto(grande)
  // Debe destacar sobre el resto del texto (si todo es del mismo tamaño, no es la pantalla de pago).
  const otros = (palabras || []).filter((w) => w !== grande).map(alto)
  if (otros.length && h < 1.6 * Math.max(...otros.filter((x) => x < h), 0)) return null
  const entero = grande.text.replace(/^[^\d]+/, '')
  const cent = (palabras || []).find((w) => {
    if (!/^[.,]?\d{2}$/.test(w.text)) return false
    const separacion = w.bbox.x0 - grande.bbox.x1
    return separacion > -5 && separacion < h * 1.2 && w.bbox.y0 >= grande.bbox.y0 - h * 0.3 && w.bbox.y1 <= grande.bbox.y1 + h * 0.1
  })
  return Number(`${entero}.${cent ? cent.text.replace(/[.,]/, '') : '00'}`)
}

export function compararMonto(texto, esperado, palabras = []) {
  const objetivo = centimos(esperado)
  const porTamano = montoPorTamano(palabras)
  const porSimbolo = montosDelTexto(texto)
  const montos = porTamano != null ? [porTamano, ...porSimbolo] : porSimbolo
  if (!montos.length) return { estado: 'ilegible', monto: null }
  // Yape pone los céntimos pequeños: el OCR puede leer "S/ 17.50" como "S/ 1750".
  const coincide = montos.some((v) => centimos(v) === objetivo || (Number.isInteger(v) && v === objetivo))
  if (coincide) return { estado: 'ok', monto: Number(esperado) }
  return { estado: 'distinto', monto: montos[0] }
}

/** Escala la captura y la pasa a blanco y negro: así se leen el "S/" y los céntimos pequeños. */
async function preparar(imagen) {
  const bitmap = await createImageBitmap(imagen)
  const escala = Math.min(2, Math.max(1, 1400 / bitmap.width))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * escala)
  canvas.height = Math.round(bitmap.height * escala)
  const g = canvas.getContext('2d', { willReadFrequently: true })
  g.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close?.()
  const datos = g.getImageData(0, 0, canvas.width, canvas.height)
  const p = datos.data
  for (let i = 0; i < p.length; i += 4) {
    const luz = 0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2]
    const v = luz > 170 ? 255 : 0
    p[i] = p[i + 1] = p[i + 2] = v
  }
  g.putImageData(datos, 0, 0)
  return canvas
}

export async function leerMontoDeCaptura(imagen, esperado) {
  let worker
  try {
    worker = await obtenerWorker()
  } catch {
    return { estado: 'error', monto: null }
  }
  // Dos lecturas: la imagen en blanco y negro (texto disperso) y, si no basta, la original.
  const salida = { text: true, blocks: true }
  const intentos = [
    async () => worker.recognize(await preparar(imagen), {}, salida),
    async () => worker.recognize(imagen, {}, salida)
  ]
  const modos = ['11', '3']
  let mejor = null
  try {
    for (let i = 0; i < intentos.length; i++) {
      await worker.setParameters({ tessedit_pageseg_mode: modos[i] })
      const { data } = await intentos[i]()
      const palabras = (data?.blocks || []).flatMap((b) =>
        (b.paragraphs || []).flatMap((p) => (p.lines || []).flatMap((l) => l.words || []))
      )
      const r = compararMonto(data?.text, esperado, palabras)
      if (r.estado === 'ok') return r
      if (!mejor || (mejor.estado === 'ilegible' && r.estado === 'distinto')) mejor = r
    }
    return mejor
  } catch {
    return mejor || { estado: 'error', monto: null }
  }
}
