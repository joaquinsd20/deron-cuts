import { useEffect, useState } from 'react'
import { api } from '../services/api.js'

function base64UrlABytes(base64) {
  const relleno = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + relleno).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

const esIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent)
const instalada = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true

export function soportaPush() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

async function suscripcionActual() {
  if (!soportaPush()) return null
  const reg = await navigator.serviceWorker.getRegistration('/')
  return reg ? reg.pushManager.getSubscription() : null
}

export async function activarAvisosAdmin() {
  const permiso = await Notification.requestPermission()
  if (permiso !== 'granted') {
    throw new Error('Permiso denegado. Actívalo en los ajustes del navegador para este sitio.')
  }
  const reg = await navigator.serviceWorker.register('/sw.js')
  await navigator.serviceWorker.ready
  const { publicKey } = await api.get('/api/public/push/clave').then((r) => r.data)
  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlABytes(publicKey)
    })
  }
  await api.post('/api/admin/push/suscripcion', sub.toJSON())
  return sub
}

/**
 * Tarjeta para que el barbero active los avisos en este celular.
 * modo="banner": solo aparece si aún no están activos (para Inicio).
 * modo="completo": siempre visible, con botón de prueba (para Cuenta y ayuda).
 */
export default function ActivarAvisos({ modo = 'banner', avisar }) {
  const [estado, setEstado] = useState('cargando') // cargando | activo | inactivo | bloqueado | sin-soporte | ios-instalar
  const [trabajando, setTrabajando] = useState(false)

  useEffect(() => {
    let vivo = true
    const revisar = async () => {
      if (!soportaPush()) {
        setEstado(esIOS() && !instalada() ? 'ios-instalar' : 'sin-soporte')
        return
      }
      if (Notification.permission === 'denied') return setEstado('bloqueado')
      const sub = await suscripcionActual().catch(() => null)
      if (!vivo) return
      if (sub && Notification.permission === 'granted') {
        setEstado('activo')
        api.post('/api/admin/push/suscripcion', sub.toJSON()).catch(() => {})
      } else {
        setEstado('inactivo')
      }
    }
    revisar()
    return () => {
      vivo = false
    }
  }, [])

  const activar = async () => {
    setTrabajando(true)
    try {
      await activarAvisosAdmin()
      setEstado('activo')
      const { data } = await api.post('/api/admin/push/prueba')
      avisar?.({ message: `Avisos activados en ${data.dispositivos} dispositivo(s). Te llegó uno de prueba.` })
    } catch (err) {
      if (Notification.permission === 'denied') setEstado('bloqueado')
      avisar?.({ message: err?.message || 'No se pudieron activar los avisos', tipo: 'error' })
    } finally {
      setTrabajando(false)
    }
  }

  const probar = async () => {
    try {
      const { data } = await api.post('/api/admin/push/prueba')
      avisar?.({ message: `Aviso de prueba enviado a ${data.dispositivos} dispositivo(s)` })
    } catch {
      avisar?.({ message: 'No se pudo enviar la prueba', tipo: 'error' })
    }
  }

  if (estado === 'cargando') return null
  if (modo === 'banner' && estado === 'activo') return null
  if (modo === 'banner' && estado === 'sin-soporte') return null

  return (
    <div className={`card avisos avisos--${estado}`}>
      <div className="avisos__icono" aria-hidden="true">
        🔔
      </div>
      <div className="avisos__texto">
        <strong>
          {estado === 'activo' ? 'Avisos activados en este celular' : 'Recibe avisos de tus citas'}
        </strong>
        <span>
          {estado === 'activo' &&
            'Te llegará una notificación con cada nueva reserva, cancelación y 2 horas antes de cada cita.'}
          {estado === 'inactivo' &&
            'Nuevas reservas, cancelaciones y recordatorios, aunque tengas el panel cerrado.'}
          {estado === 'bloqueado' &&
            'Bloqueaste las notificaciones. Actívalas en los ajustes del navegador (candado junto a la dirección) y vuelve a intentarlo.'}
          {estado === 'ios-instalar' &&
            'En iPhone primero instala el panel: Compartir → Agregar a pantalla de inicio. Luego ábrelo desde el ícono y activa los avisos.'}
          {estado === 'sin-soporte' && 'Este navegador no permite notificaciones. Usa Chrome o Safari actualizado.'}
        </span>
      </div>
      {estado === 'inactivo' && (
        <button type="button" className="btn btn--primary" onClick={activar} disabled={trabajando}>
          {trabajando ? 'Activando…' : 'Activar'}
        </button>
      )}
      {estado === 'activo' && modo === 'completo' && (
        <button type="button" className="btn btn--outline" onClick={probar}>
          Enviar prueba
        </button>
      )}
    </div>
  )
}
