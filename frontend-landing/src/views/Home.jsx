import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Services from '../components/Services.jsx'
import AboutYumpi from '../components/AboutYumpi.jsx'
import Schedule from '../components/Schedule.jsx'
import LocationContact from '../components/LocationContact.jsx'
import Footer from '../components/Footer.jsx'
import ScrollReveal from '../components/ScrollReveal.jsx'
import BeforeAfter from '../components/BeforeAfter.jsx'
import { getConfiguracion } from '../services/api.js'

export default function Home() {
  const [config, setConfig] = useState(null)
  const [error, setError] = useState(false)
  const [videoPaused, setVideoPaused] = useState(false)
  const videoRef = useRef(null)

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
          <h2>No pudimos conectar con el servidor</h2>
          <p>
            Verifica que el servidor de DERON CUTS esté corriendo en <b>http://localhost:8082</b> y
            recarga la página.
          </p>
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
        <AboutYumpi config={config} />
        <section className="section proceso" id="proceso">
          <div className="container proceso__grid">
            <div className="proceso__copy">
              <span className="section-tag">El cambio</span>
              <h2 className="section-title">
                El detalle se nota <span className="acc">en cada corte</span>
              </h2>
              <p className="section-sub">
                Desliza el control para ver el avance: del primer pase al acabado final.
              </p>
              <Link to="/reservar" className="btn btn--primary proceso__cta">
                Quiero mi cambio
              </Link>
            </div>
            <BeforeAfter
              before="/cortes/proceso-antes.jpg"
              after="/cortes/proceso-despues.jpg"
            />
          </div>
        </section>
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