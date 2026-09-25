import { Link } from 'react-router-dom'
import { formatCurrency } from '../config.js'

export default function Services({ servicios = [] }) {
  if (servicios.length === 0) return null

  return (
    <section className="section services" id="servicios">
      <div className="container">
        <span className="section-tag">El menú</span>
        <h2 className="section-title">
          Cortes que <span className="acc">hablan</span> por ti
        </h2>
        <p className="section-sub">
          Precios y servicios gestionados desde el panel de Yumpi. Si un corte no está en la lista,
          la máquina 0 siempre está lista para inventar uno.
        </p>

        <div className="services__grid">
          {servicios.map((svc) => (
            <article className="svc-card" key={svc.id}>
              <div
                className="svc-card__media"
                style={
                  svc.imagenUrl
                    ? undefined
                    : { '--svc-gradient': `linear-gradient(140deg, ${gradientFor(svc.id)} )` }
                }
              >
                {svc.imagenUrl ? (
                  <img src={svc.imagenUrl} alt={`Servicio ${svc.nombre}`} loading="lazy" />
                ) : (
                  <span>{svc.nombre.charAt(0)}</span>
                )}
              </div>
              <div className="svc-card__body">
                <h3 className="svc-card__name">{svc.nombre}</h3>
                <p className="svc-card__desc">{svc.descripcion}</p>
                <div className="svc-card__meta">
                  <span className="svc-card__price">{formatCurrency(svc.precio)}</span>
                  <span className="svc-card__dur">{svc.duracionMinutos} min</span>
                </div>
                <Link
                  to={`/reservar?servicio=${svc.id}`}
                  className="btn btn--ghost"
                  style={{ marginTop: 16 }}
                >
                  Reservar este corte
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function gradientFor(id) {
  const palettes = [
    '#26262c 0%, #121216 100%',
    '#2e2e36 0%, #1a1a1f 100%',
    '#202027 0%, #101014 100%',
    '#2a2a31 0%, #16161b 100%'
  ]
  return palettes[(id - 1) % palettes.length]
}