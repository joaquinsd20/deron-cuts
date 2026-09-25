import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Services from '../components/Services.jsx'
import AboutYumpi from '../components/AboutYumpi.jsx'
import Schedule from '../components/Schedule.jsx'
import LocationContact from '../components/LocationContact.jsx'
import Footer from '../components/Footer.jsx'
import { getConfiguracion } from '../services/api.js'

export default function Home() {
  const [config, setConfig] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    getConfiguracion()
      .then((cfg) => {
        setConfig(cfg)
      })
      .catch(() => setError(true))
  }, [])

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
      <main>
        <section className="barber-film" aria-label="Video de barbería">
          <video
            className="barber-film__video"
            src="/videos/corte.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          />
          <div className="barber-film__scrim" aria-hidden="true" />
          <div className="barber-film__cta">
            <Link to="/reservar" className="btn btn--primary">
              Reserva YA!
            </Link>
          </div>
        </section>
        <Services />
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