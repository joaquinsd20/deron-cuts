import { useEffect, useState } from 'react'
import { api } from '../services/api.js'

function base64UrlABytes(base64) {
  const relleno = '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + relleno).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

const soporta = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
const esIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent)

/** Botón para que el cliente reciba avisos de su cita (confirmación, cambios y recordatorio). */
export default function AvisosCita() {
  const [estado, setEstado] = useState('cargando') // cargando | activo | inactivo | bloqueado | ios | sin-soporte
  const [trabajando, setTrabajando] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let vivo = true
    ;(async () => {
      if (!soporta()) return setEstado(esIOS() ? 'ios' : 'sin-soporte')
      if (Notification.permission === 'denied') return setEstado('bloqueado')
      const reg = await navigator.serviceWorker.getRegistration('/').catch(() => null)
      const sub = reg ? await reg.pushManager.getSubscription().catch(() => null) : null
      if (!vivo) return
      if (sub && Notification.permission === 'granted') {
        setEstado('activo')
        api.post('/api/cliente/push/suscripcion', sub.toJSON()).catch(() => {})
      } else {
        setEstado('inactivo')
      }
    })()
    return () => {
      vivo = false
    }
  }, [])

  const activar = async () => {
    setTrabajando(true)
    setError(null)
    try {
      const permiso = await Notification.requestPermission()
      if (permiso !== 'granted') {
        setEstado(permiso === 'denied' ? 'bloqueado' : 'inactivo')
        return
      }
      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready
      const { publicKey } = await api.get('/api/public/push/clave').then((r) => r.data)
      const sub =
        (await reg.pushManager.getSubscription()) ||
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64UrlABytes(publicKey) }))
      await api.post('/api/cliente/push/suscripcion', sub.toJSON())
      setEstado('activo')
    } catch {
      setError('No pudimos activar los avisos. Inténtalo de nuevo.')
    } finally {
      setTrabajando(false)
    }
  }

  if (estado === 'cargando' || estado === 'sin-soporte') return null

  return (
    <div className={`avisos-cita avisos-cita--${estado}`}>
      <span className="avisos-cita__icono" aria-hidden="true">
        🔔
      </span>
      <div className="avisos-cita__texto">
        {estado === 'activo' && (
          <>
            <b>Avisos activados.</b> Te avisaremos cuando tu cita se confirme, si cambia y unas horas antes.
          </>
        )}
        {estado === 'inactivo' && (
          <>
            <b>¿Te avisamos de tu cita?</b> Recibe una notificación cuando se confirme y antes de que empiece.
          </>
        )}
        {estado === 'bloqueado' && (
          <>
            <b>Notificaciones bloqueadas.</b> Actívalas en los ajustes del navegador para este sitio.
          </>
        )}
        {estado === 'ios' && (
          <>
            <b>En iPhone:</b> toca Compartir → <i>Agregar a pantalla de inicio</i>, abre Deron Cuts desde el
            ícono y activa los avisos en Mi cuenta.
          </>
        )}
        {error && <span className="avisos-cita__error">{error}</span>}
      </div>
      {estado === 'inactivo' && (
        <button type="button" className="btn btn--primary" onClick={activar} disabled={trabajando}>
          {trabajando ? 'Activando…' : 'Avisarme'}
        </button>
      )}
    </div>
  )
}
