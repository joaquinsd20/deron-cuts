const listeners = new Set()
let pending = 0
let showTimer = null
let hideTimer = null

export function beginLoading() {
  pending += 1
  if (pending === 1) {
    clearTimeout(hideTimer)
    // Pequeño retraso para no parpadear en peticiones rápidas
    showTimer = setTimeout(() => {
      if (pending > 0) listeners.forEach((cb) => cb(true))
    }, 280)
  }
}

export function endLoading() {
  pending = Math.max(0, pending - 1)
  if (pending === 0) {
    clearTimeout(showTimer)
    hideTimer = setTimeout(() => {
      if (pending === 0) listeners.forEach((cb) => cb(false))
    }, 220)
  }
}

export function onLoadingChange(cb) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function isLoading() {
  return pending > 0
}
