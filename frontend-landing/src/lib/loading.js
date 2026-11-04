const listeners = new Set()
let pending = 0
let shownAt = 0
let hideTimer = null
const MIN_DISPLAY = 700

export function beginLoading() {
  pending += 1
  if (pending === 1) {
    shownAt = Date.now()
    listeners.forEach((cb) => cb(true))
  }
}

export function endLoading() {
  pending = Math.max(0, pending - 1)
  if (pending === 0) {
    const elapsed = Date.now() - shownAt
    const wait = Math.max(0, MIN_DISPLAY - elapsed)
    clearTimeout(hideTimer)
    hideTimer = setTimeout(() => {
      if (pending === 0) listeners.forEach((cb) => cb(false))
    }, wait)
  }
}

export function onLoadingChange(cb) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function isLoading() {
  return pending > 0
}
