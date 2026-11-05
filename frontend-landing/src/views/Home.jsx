import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Services from '../components/Services.jsx'
import AboutYumpi from '../components/AboutYumpi.jsx'
import Schedule from '../components/Schedule.jsx'
import LocationContact from '../components/LocationContact.jsx'
import Footer from '../components/Footer.jsx'
import ScrollReveal from '../components/ScrollReveal.jsx'
import Pasos from '../components/Pasos.jsx'
import { getConfiguracion } from '../services/api.js'
import { estadoNegocio } from '../lib/horario.js'

export default function Home() {
  const [config, setConfig] = useState(null)
  const [error, setError] = useState(false)
  const [videoPaused, setVideoPaused] = useState(false)
  const videoRef = useRef(null)
  const [, setTick] = useState(0)
  const estado = config ? estadoNegocio(config.horario) : null

  // Refresca "Abierto ahora / Cerrado" cada minuto sin recargar la página.
  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 60000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    getConfiguracion()
      .then((cfg) => {
        setConfig(cfg)
      })
      .catch(() => setError(true))
  }, [])

  const toggleVideo = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.play().catch(() => {})
    } else {
      video.pause()
    }
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="error-state container">
          <h2>Estamos despertando el sistema</h2>
          <p>
            La página tardó en responder. Espera unos segundos y recarga; si sigue igual,
            escríbenos por WhatsApp y te agendamos al toque.
          </p>
          <button type="button" className="btn btn--outline" onClick={() => window.location.reload()}>
            Recargar
          </button>
          <Link to="/reservar" className="btn btn--primary">
            Intentar reservar igual
          </Link>
        </div>
        <Footer config={null} />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <ScrollReveal />
      <main>
        <section className="barber-film" aria-label="Video de barbería">
          <div className="barber-film__ambient" aria-hidden="true" />
          <div className="container barber-film__inner">
            <div className="barber-film__copy">
              <span className="barber-film__tag">Barber Studio · Reserva online</span>
              <h1 className="barber-film__title">
                Tu estilo,
                <br />
                <span>al siguiente nivel</span>
              </h1>
              <p className="barber-film__text">
                Cortes a medida, atención personalizada y una reserva en línea en menos de un
                minuto.
              </p>
              <div className="barber-film__actions">
                <Link to="/reservar" className="btn btn--primary">
                  Reservar mi corte
                </Link>
                <a href="#servicios" className="btn btn--outline">
                  Ver cortes
                </a>
              </div>
              {estado && (
                <div className={`live-status${estado.abierto ? ' live-status--open' : ''}`}>
                  <span className="live-status__dot" aria-hidden="true" />
                  {estado.texto}
                </div>
              )}
              <ul className="barber-film__points">
                <li>Reserva en línea</li>
                <li>Atención personalizada</li>
                <li>Yape y Plin</li>
              </ul>
            </div>

            <div className="barber-film__stage">
              <video
                ref={videoRef}
                className="barber-film__video"
                src="/videos/corte.mp4"
                poster="/videos/corte-poster.jpg"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                onClick={toggleVideo}
                onPlay={() => setVideoPaused(false)}
                onPause={() => setVideoPaused(true)}
              />
              <div className="barber-film__scrim" aria-hidden="true" />
              <button
                type="button"
                className="barber-film__play"
                onClick={toggleVideo}
                aria-label={videoPaused ? 'Reproducir video' : 'Pausar video'}
              >
                {videoPaused ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </section>
        <Services />
        <Pasos />
        <AboutYumpi config={config} />
        <Schedule config={config} />
        <LocationContact config={config} />
        <section className="cta-final">
          <div className="container">
            <h2 className="cta-final__title">
              ¿Listo para tu <span>próximo corte?</span>
            </h2>
            <p className="cta-final__copy">
              Resérvalo en menos de un minuto y llega a la hora. Yumpi te espera.
            </p>
            <Link to="/reservar" className="btn btn--primary">
              Reservar mi corte
            </Link>
          </div>
        </section>
      </main>
      <Footer config={config} />
    </>
  )
}