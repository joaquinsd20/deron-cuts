import { useEffect, useRef, useState } from 'react'
import { onLoadingChange } from '../lib/loading.js'

export default function LoadingCookie() {
  const [visible, setVisible] = useState(false)
  const [cracked, setCracked] = useState(false)
  const clickCount = useRef(0)

  useEffect(() => onLoadingChange(setVisible), [])

  useEffect(() => {
    if (!visible) setCracked(false)
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
        {cracked ? '¡Se rompió! Horneando otra...' : 'Horneando tu página...'}
      </span>
    </div>
  )
}
