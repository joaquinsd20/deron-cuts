import { buildWhatsappLink } from '../config.js'

export default function LocationContact({ config }) {
  if (!config) return null
  const {
    direccion,
    enlaceMapa,
    telefono,
    email,
    instagram,
    tiktok,
    nombreBarbero,
    nombreNegocio
  } = config

  return (
    <section className="section" id="ubicacion">
      <div className="container">
        <span className="section-tag">Encuéntranos</span>
        <h2 className="section-title">
          Ubicación y <span className="acc">contacto</span>
        </h2>

        <div className="loc__grid">
          <a
            className="loc__map"
            href={enlaceMapa || '#'}
            target="_blank"
            rel="noreferrer"
          >
            {enlaceMapa ? 'Ver en el mapa con tu GPS' : 'Mapa pendiente: actualiza la configuración'}
          </a>

          <div className="loc__items">
            <div className="loc__item">
              <div className="loc__icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <path d="M12 21s-7-5.1-7-11a7 7 0 1 1 14 0c0 5.9-7 11-7 11z" />
                  <circle cx="12" cy="10" r="2.6" />
                </svg>
              </div>
              <div>
                <div className="loc__label">Dirección</div>
                <div className="loc__value">{direccion}</div>
              </div>
            </div>

            <div className="loc__item">
              <div className="loc__icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <path d="M4 5h16v13H4z" />
                  <path d="m4 6 8 6 8-6" />
                </svg>
              </div>
              <div>
                <div className="loc__label">WhatsApp / Teléfono</div>
                <div className="loc__value">
                  {buildWhatsappLink(telefono, `Hola ${nombreBarbero}, quiero agendar un corte en ${nombreNegocio}`) ? (
                    <a
                      href={buildWhatsappLink(telefono, `Hola ${nombreBarbero}, quiero agendar un corte en ${nombreNegocio}`)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {telefono}
                    </a>
                  ) : (
                    telefono
                  )}
                </div>
              </div>
            </div>

            {email && (
              <div className="loc__item">
                <div className="loc__icon">@</div>
                <div>
                  <div className="loc__label">Correo</div>
                  <div className="loc__value">
                    <a href={`mailto:${email}`}>{email}</a>
                  </div>
                </div>
              </div>
            )}

            {(instagram || tiktok) && (
              <div className="loc__item">
                <div className="loc__icon">#</div>
                <div>
                  <div className="loc__label">Redes</div>
                  <div className="loc__value">
                    {instagram && (
                      <a href={instagram} target="_blank" rel="noreferrer">
                        Instagram{'  '}
                      </a>
                    )}
                    {tiktok && (
                      <a href={tiktok} target="_blank" rel="noreferrer">
                        TikTok
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}