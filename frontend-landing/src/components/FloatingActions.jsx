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
  const audioRef = useRef(null)
  const fadeRef = useRef(0)

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

    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.7)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [isHome])

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

    if (!audio.paused) {
      fadeTo(0, 350)
      window.setTimeout(() => audio.pause(), 380)
      setPlaying(false)
      return
    }

    audio.volume = 0
    try {
      await audio.play()
      setPlaying(true)
      fadeTo(0.3, 1200)
    } catch {
      setPlaying(false)
    }
  }

  const wa = buildWhatsappLink(
    config?.telefono,
    `Hola ${config?.nombreBarbero || 'Yumpi'}, quiero agendar un corte en ${
      config?.nombreNegocio || 'DERON CUTS'
    }`
  )

  return (
    <div className={`floaties${visible ? ' floaties--show' : ''}`}>
      <audio ref={audioRef} src="/audio/ambiente.mp3" loop preload="none" />

      <button
        type="button"
        className={`fab fab--music${playing ? ' is-playing' : ''}`}
        onClick={toggleMusic}
        aria-label={playing ? 'Silenciar música' : 'Activar música'}
        aria-pressed={playing}
        title={playing ? 'Silenciar música' : 'Activar música'}
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
