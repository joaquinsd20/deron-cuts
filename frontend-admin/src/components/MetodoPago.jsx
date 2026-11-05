import { useEffect, useState } from 'react'
import { getConfiguracionAdmin } from '../services/api.js'

// ---------- Lista de métodos configurados (se pide una vez y se comparte) ----------

const POR_DEFECTO = ['EFECTIVO', 'YAPE', 'PLIN']
let cache = null
let pedido = null
const oyentes = new Set()

export function refrescarMetodosPago(lista) {
  cache = lista && lista.length ? lista : POR_DEFECTO
  oyentes.forEach((fn) => fn(cache))
}

export function useMetodosPago() {
  const [metodos, setMetodos] = useState(cache || POR_DEFECTO)
  useEffect(() => {
    oyentes.add(setMetodos)
    if (!cache && !pedido) {
      pedido = getConfiguracionAdmin()
        .then((c) => refrescarMetodosPago(c.metodosPago))
        .catch(() => refrescarMetodosPago(POR_DEFECTO))
        .finally(() => {
          pedido = null
        })
    }
    return () => oyentes.delete(setMetodos)
  }, [])
  return metodos
}

// ---------- Nombre e ícono de cada método ----------

const CONOCIDOS = {
  EFECTIVO: { nombre: 'Efectivo', clase: 'efectivo' },
  YAPE: { nombre: 'Yape', clase: 'yape' },
  PLIN: { nombre: 'Plin', clase: 'plin' }
}

export function nombreMetodo(metodo) {
  if (!metodo) return '—'
  const k = String(metodo).toUpperCase()
  if (CONOCIDOS[k]) return CONOCIDOS[k].nombre
  return k.charAt(0) + k.slice(1).toLowerCase()
}

/** Logo de color del método: Yape morado, Plin turquesa/azul, Efectivo verde. */
export function MetodoIcono({ metodo, tamano = 32 }) {
  const k = String(metodo || '').toUpperCase()
  const info = CONOCIDOS[k]
  const style = { width: tamano, height: tamano, fontSize: tamano * 0.3 }
  if (k === 'EFECTIVO') {
    return (
      <span className="metodo-ico metodo-ico--efectivo" style={style} aria-hidden="true">
        <svg viewBox="0 0 24 24" width={tamano * 0.62} height={tamano * 0.62}>
          <rect x="2.5" y="6" width="19" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="12" cy="12" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M6 9.5v5M18 9.5v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </span>
    )
  }
  if (info) {
    return (
      <span className={`metodo-ico metodo-ico--${info.clase}`} style={style} aria-hidden="true">
        {info.clase}
      </span>
    )
  }
  const iniciales = k.split(' ').map((p) => p[0]).join('').slice(0, 2) || '?'
  return (
    <span className="metodo-ico metodo-ico--otro" style={{ ...style, fontSize: tamano * 0.36 }} aria-hidden="true">
      {iniciales}
    </span>
  )
}

/** Botones grandes con logo para elegir el método (en vez de una lista desplegable). */
export function MetodoSelector({ valor, onChange, metodos }) {
  return (
    <div className="metodo-selector" role="radiogroup" aria-label="Método de pago">
      {metodos.map((m) => (
        <button
          key={m}
          type="button"
          role="radio"
          aria-checked={valor === m}
          className={`metodo-opcion${valor === m ? ' metodo-opcion--activa' : ''}`}
          onClick={() => onChange(m)}
        >
          <MetodoIcono metodo={m} tamano={40} />
          <span>{nombreMetodo(m)}</span>
        </button>
      ))}
    </div>
  )
}
