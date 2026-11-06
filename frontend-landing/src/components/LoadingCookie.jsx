import { useEffect, useRef, useState } from 'react'
import { onLoadingChange } from '../lib/loading.js'

export default function LoadingCookie() {
  const [visible, setVisible] = useState(false)
  const [cracked, setCracked] = useState(false)
  const clickCount = useRef(0)

  useEffect(() => onLoadingChange(setVisible), [])

  // Si el servidor está "dormido" (plan gratis de Render) la primera carga puede tardar
  // hasta ~2 min: tras 6 s se explica qué pasa para que no parezca que la página se colgó.
  const [lento, setLento] = useState(false)

  useEffect(() => {
    if (!visible) {
      setCracked(false)
      setLento(false)
      return undefined
    }
    const id = window.setTimeout(() => setLento(true), 6000)
    return () => window.clearTimeout(id)
  }, [visible])

  if (!visible) return null

  const handleClick = () => {
    clickCount.current += 1
    setCracked(true)
    window.setTimeout(() => setCracked(false), 1400)
  }

  return (
    <div className="loading-cookie" role="status" aria-live="polite" aria-label="Cargando">
      <button
        type="button"
        className={`loading-cookie__btn${cracked ? ' is-cracked' : ''}`}
        onClick={handleClick}
        aria-label="Galleta de carga, haz clic para interactuar"
      >
        <span className="loading-cookie__emoji" aria-hidden="true">
          🍪
        </span>
        {cracked && (
          <span className="loading-cookie__crumbs" aria-hidden="true">
            🍪🍪🍪
          </span>
        )}
      </button>
      <span className="loading-cookie__text">
        {cracked ? '¡Se rompió! Horneando otra...' : 'Cargando...'}
      </span>
      {lento && (
        <span className="loading-cookie__lento">
          Estamos despertando el sistema de reservas. La primera visita puede tardar hasta 2
          minutos; no cierres la página.
        </span>
      )}
    </div>
  )
}
