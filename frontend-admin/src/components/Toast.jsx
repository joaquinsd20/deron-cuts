import { useEffect } from 'react'

export default function Toast({ message, tipo, onClose, duracion = 3500 }) {
  useEffect(() => {
    if (!message) return
    const t = setTimeout(() => onClose?.(), duracion)
    return () => clearTimeout(t)
  }, [message, duracion, onClose])

  if (!message) return null
  const clase = 'toast' + (tipo === 'error' ? ' toast--error' : '')
  return (
    <div className={clase} key={message}>
      <span>{message}</span>
      <button className="toast__close" onClick={onClose} aria-label="Cerrar">
        ×
      </button>
    </div>
  )
}