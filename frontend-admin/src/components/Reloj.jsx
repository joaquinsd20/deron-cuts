import { useEffect, useState } from 'react'

export default function Reloj() {
  const [ahora, setAhora] = useState(() => new Date())

  useEffect(() => {
    const t = setInterval(() => setAhora(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const fecha = ahora.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: '2-digit',
    month: 'long'
  })

  const hora = ahora.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })

  return (
    <div className="reloj">
      <span className="reloj__fecha">{fecha}</span>
      <span className="reloj__hora">{hora}</span>
    </div>
  )
}