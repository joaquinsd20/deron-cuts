import { Link } from 'react-router-dom'

const SHOTS = [
  { img: '/cortes/IMG_3922.jpg', label: 'Low Fade', precio: 'S/ 35' },
  { img: '/cortes/IMG_4208.jpg', label: 'Drop Fade', precio: 'S/ 50' },
  { img: '/cortes/IMG_5413.jpg', label: 'Taper Fade', precio: 'S/ 25' },
  { img: '/cortes/corte-4.jpg', label: 'Mid Taper Fade', precio: 'S/ 30' }
]

export default function Services() {
  return (
    <section className="section services" id="servicios">
      <div className="container">
        <span className="section-tag">El menú</span>

        <div className="services__shots">
          {SHOTS.map((s) => (
            <figure className="shot" key={s.label}>
              <img src={s.img} alt={s.label} loading="lazy" />
              <figcaption className="shot__meta">
                <span className="shot__label">{s.label}</span>
                <span className="shot__price">{s.precio}</span>
              </figcaption>
            </figure>
          ))}

          <figure className="shot shot--custom">
            <div className="shot__custom-art" aria-hidden="true">
              <span>+</span>
            </div>
            <figcaption className="shot__meta">
              <span className="shot__label">Personalizado</span>
              <span className="shot__price">S/ 30</span>
            </figcaption>
          </figure>
        </div>

        <div className="services__no-grid">
          <p>
            ¿No encuentras el corte que buscas?{' '}
            <Link to="/reservar" className="services__link">
              Resérvalo y lo hacemos personalizado
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}