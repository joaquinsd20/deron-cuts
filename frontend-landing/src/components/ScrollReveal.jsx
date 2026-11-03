import { useEffect } from 'react'

const SELECTOR = '.section, .cta-final'

export default function ScrollReveal() {
  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
    if (reduced || !('IntersectionObserver' in window)) return

    const targets = Array.from(document.querySelectorAll(SELECTOR)).filter(
      (el) => !el.classList.contains('reveal')
    )
    if (!targets.length) return

    const pending = targets.filter((el) => {
      const top = el.getBoundingClientRect().top
      if (top < window.innerHeight * 0.9) return false
      el.classList.add('reveal')
      return true
    })

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('reveal--in')
          observer.unobserve(entry.target)
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
    )

    pending.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return null
}
