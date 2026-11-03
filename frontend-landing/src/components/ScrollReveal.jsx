import { useEffect } from 'react'

const SELECTOR = '.section, .cta-final'

export default function ScrollReveal() {
  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
    if (reduced) return

    const targets = Array.from(document.querySelectorAll(SELECTOR))
    if (!targets.length) return

    const check = () => {
      const limit = window.innerHeight * 0.9
      targets.forEach((el) => {
        if (el.classList.contains('reveal--in')) return
        if (el.getBoundingClientRect().top < limit) el.classList.add('reveal--in')
      })
    }

    targets.forEach((el) => {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.9) {
        el.classList.add('reveal--in')
      } else {
        el.classList.add('reveal')
      }
    })

    window.addEventListener('scroll', check, { passive: true })
    window.addEventListener('resize', check)

    return () => {
      window.removeEventListener('scroll', check)
      window.removeEventListener('resize', check)
    }
  }, [])

  return null
}
