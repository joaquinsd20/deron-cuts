import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { getConfiguracion } from '../services/api.js'
import { buildWhatsappLink } from '../config.js'
import { IconWhatsApp } from './icons.jsx'

export default function FloatingActions() {
  const location = useLocation()
  const isHome = location.pathname === '/'
  const [config, setConfig] = useState(null)
  const [visible, setVisible] = useState(!isHome)
  const [playing, setPlaying] = useState(false)
  const [mutedAuto, setMutedAuto] = useState(false)
  const audioRef = useRef(null)
  const fadeRef = useRef(0)
  const unmuteCleanupRef = useRef(null)

  useEffect(() => {
    getConfiguracion()
      .then(setConfig)
      .catch(() => setConfig(null))
  }, [])

  useEffect(() => {
    if (!isHome) {
      setVisible(true)
      return
    }
    const onScroll = () => setVisible((prev) => prev || window.scrollY > window.innerHeight * 0.7)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [isHome])

  // Música automática: intentar autoplay con sonido; si el navegador lo bloquea,
  // arrancar en silencio y activar el sonido en la primera interacción.
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    let cancelled = false

    const unmute = () => {
      const a = audioRef.current
      if (!a) return
      a.muted = false
      a.volume = 0
      fadeTo(0.3, 1200)
      setPlaying(true)
      setMutedAuto(false)
      cleanupListeners()
    }

    const cleanupListeners = () => {
      window.removeEventListener('click', unmute, true)
      window.removeEventListener('scroll', unmute, true)
      window.removeEventListener('touchstart', unmute, true)
      window.removeEventListener('keydown', unmute, true)
      unmuteCleanupRef.current = null
    }

    const registerUnmute = () => {
      unmuteCleanupRef.current = cleanupListeners
      window.addEventListener('click', unmute, true)
      window.addEventListener('scroll', unmute, true)
      window.addEventListener('touchstart', unmute, true)
      window.addEventListener('keydown', unmute, true)
    }

    const startMuted = async () => {
      if (cancelled) return
      audio.muted = true
      audio.volume = 0
      try {
        await audio.play()
        if (cancelled) return
        setMutedAuto(true)
        setVisible(true)
        registerUnmute()
      } catch {
        setMutedAuto(false)
      }
    }

    audio.muted = false
    audio.volume = 0.3
    const attempt = audio.play()
    if (attempt && typeof attempt.then === 'function') {
      attempt
        .then(() => {
          if (cancelled) return
          setPlaying(true)
          setVisible(true)
        })
        .catch(() => startMuted())
    } else {
      setPlaying(true)
      setVisible(true)
    }

    return () => {
      cancelled = true
      cleanupListeners()
    }
  }, [])

  useEffect(() => {
    if (playing || mutedAuto) setVisible(true)
  }, [playing, mutedAuto])

  useEffect(() => () => cancelAnimationFrame(fadeRef.current), [])

  const fadeTo = (target, duration) => {
    const audio = audioRef.current
    if (!audio) return
    cancelAnimationFrame(fadeRef.current)
    const from = audio.volume
    const start = performance.now()
    const step = (now) => {
      const progress = Math.min(1, (now - start) / duration)
      audio.volume = Math.min(1, Math.max(0, from + (target - from) * progress))
      if (progress < 1) fadeRef.current = requestAnimationFrame(step)
    }
    fadeRef.current = requestAnimationFrame(step)
  }

  const toggleMusic = async () => {
    const audio = audioRef.current
    if (!audio) return

    if (unmuteCleanupRef.current) {
      unmuteCleanupRef.current()
    }

    if (!audio.paused) {
      fadeTo(0, 350)
      window.setTimeout(() => audio.pause(), 380)
      audio.muted = true
      setPlaying(false)
      setMutedAuto(false)
      return
    }

    audio.muted = false
    audio.volume = 0
    try {
      await audio.play()
      setPlaying(true)
      setMutedAuto(false)
      fadeTo(0.3, 1200)
    } catch {
      setPlaying(false)
    }
  }

  const wa = buildWhatsappLink(
    config?.telefono,
    `Hola ${config?.nombreBarbero || 'Yumpi'}, quiero agendar un corte en ${config?.nombreNegocio || 'DERON CUTS'}`
  )

  const buttonLabel = playing
    ? 'Silenciar música'
    : mutedAuto
    ? 'Activar sonido'
    : 'Activar música'

  return (
    <div className={`floaties${visible ? ' floaties--show' : ''}`}>
      <audio ref={audioRef} src="/audio/ambiente.mp3" loop preload="auto" />

      <button
        type="button"
        className={`fab fab--music${playing ? ' is-playing' : ''}`}
        onClick={toggleMusic}
        aria-label={buttonLabel}
        aria-pressed={playing}
        title={buttonLabel}
      >
        <span className="eq" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </span>
      </button>

      {wa && (
        <a
          className="fab fab--wa"
          href={wa}
          target="_blank"
          rel="noreferrer"
          aria-label="Escribir por WhatsApp"
          title="Escríbenos por WhatsApp"
        >
          <IconWhatsApp size={26} />
        </a>
      )}
    </div>
  )
}
