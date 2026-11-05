import { useEffect, useState } from 'react'

// El navegador dispara beforeinstallprompt una sola vez y puede ser antes de que
// se monte el menú, así que se guarda aquí a nivel de módulo.
let eventoInstalacion = null
const oyentes = new Set()

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    eventoInstalacion = e
    oyentes.forEach((fn) => fn())
  })
  window.addEventListener('appinstalled', () => {
    eventoInstalacion = null
    oyentes.forEach((fn) => fn())
  })
}

export function registrarServiceWorker() {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

function estaInstalada() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true
  )
}

export function useInstalarApp() {
  const [, forzar] = useState(0)

  useEffect(() => {
    const fn = () => forzar((n) => n + 1)
    oyentes.add(fn)
    return () => oyentes.delete(fn)
  }, [])

  const esIOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent)

  return {
    puedeInstalar: !!eventoInstalacion,
    esIOS,
    instalada: estaInstalada(),
    instalar: async () => {
      if (!eventoInstalacion) return
      eventoInstalacion.prompt()
      await eventoInstalacion.userChoice.catch(() => null)
      eventoInstalacion = null
      oyentes.forEach((fn) => fn())
    }
  }
}
