import { Link } from 'react-router-dom'

export default function Hero() {
  return (
    <section className="hero">
      <div className="container">
        <div className="hero__grid">
          <div>
            <p className="hero__eyebrow">Barbería urbana · Desde la máquina 0 hasta el detalle</p>
            <h1 className="hero__title">
              <span className="t1">Tu corte.</span>
              <span className="t2">Tu ritmo.</span>
              <span className="t3">Sin filtro.</span>
            </h1>
            <p className="hero__copy">
              DERON CUTS es la barbería de Yumpi: fades, degradados, barba y cortes urbanos con
              atención de uno a uno, buen ambiente y música para que cada visita tenga carácter.
            </p>
            <div className="hero__actions">
              <Link to="/reservar" className="btn btn--primary">
                Reservar mi corte
              </Link>
              <a href="#servicios" className="btn btn--outline">
                Ver servicios
              </a>
            </div>
          </div>

          <div className="hero__poster" aria-hidden="true">
            <span className="hero__sweep" />
            <div className="hero__poster-top">
              <span>DC</span>
              <span>Est. 2026</span>
            </div>
            <div className="hero__poster-center">
              Fade
              <br />
              c<b>o</b>n
              <br />
              <span>style</span>
            </div>
            <div className="hero__poster-bottom">
              <span>1 Barber · Yumpi</span>

            </div>
          </div>
        </div>

  
        </div>
    
    </section>
  )
}