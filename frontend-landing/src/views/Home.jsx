import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Services from '../components/Services.jsx'
import Gallery from '../components/Gallery.jsx'
import AboutYumpi from '../components/AboutYumpi.jsx'
import Schedule from '../components/Schedule.jsx'
import LocationContact from '../components/LocationContact.jsx'
import Footer from '../components/Footer.jsx'
import { getConfiguracion, getServicios } from '../services/api.js'

export default function Home() {
  const [config, setConfig] = useState(null)
  const [servicios, setServicios] = useState([])
  const [error, setError] = useState(false)

  useEffect(() => {
    Promise.all([getConfiguracion(), getServicios()])
      .then(([cfg, svc]) => {
        setConfig(cfg)
        setServicios(svc)
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
        </section>
        <section className="hero-cta">
          <h2 className="hero-cta__title">
            Tu próximo corte te <span>espera</span>
          </h2>
          <p className="hero-cta__copy">
            Elige el corte que quieras, elige la hora y deja el resto en manos de Yumpi.
          </p>
          <Link to="/reservar" className="btn btn--primary hero-cta__btn">
            Reserva YA!
          </Link>
        </section>
        <Services servicios={servicios} />
        <Gallery />
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