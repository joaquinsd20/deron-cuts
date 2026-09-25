import { buildWhatsappLink } from '../config.js'
import { IconWhatsApp, IconMail, IconLink, IconInstagram, IconTikTok } from './icons.jsx'

const MAPA_EMBED =
  'https://www.google.com/maps?q=Valeriano%20362%2C%20V%C3%ADctor%20Larco%20Herrera%2013009&hl=es&z=17&output=embed'

export default function LocationContact({ config }) {
  if (!config) return null
  const {
    direccion,
    enlaceMapa,
    telefono,
    email,
    instagram,
    nombreBarbero,
    nombreNegocio
  } = config

  const mensajeWa = `Hola ${nombreBarbero}, quiero agendar un corte en ${nombreNegocio}`
  const enlaceWa = buildWhatsappLink(telefono, mensajeWa)
  const tiktok = config.tiktok

  return (
    <section className="section" id="ubicacion">
      <div className="container">
        <span className="section-tag">Encuéntranos</span>
        <h2 className="section-title">
          Ubicación y <span className="acc">contacto</span>
        </h2>

        <div className="loc__grid">
          <div className="loc__map">
            <iframe
              title="Mapa de ubicación de DERON CUTS"
              src={MAPA_EMBED}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />
            {enlaceMapa && (
              <a
                className="loc__map-link"
                href={enlaceMapa}
                target="_blank"
                rel="noreferrer"
              >
                Abrir en Google Maps
              </a>
            )}
          </div>

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
                <IconWhatsApp />
              </div>
              <div>
                <div className="loc__label">WhatsApp / Teléfono</div>
                <div className="loc__value">
                  {enlaceWa ? (
                    <a href={enlaceWa} target="_blank" rel="noreferrer">
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
                <div className="loc__icon">
                  <IconMail />
                </div>
                <div>
                  <div className="loc__label">Correo</div>
                  <div className="loc__value">
                    <a href={`mailto:${email}`}>{email}</a>
                  </div>
                </div>
              </div>
            )}

            {(instagram || tiktok || enlaceWa) && (
              <div className="loc__item">
                <div className="loc__icon">
                  <IconLink />
                </div>
                <div>
                  <div className="loc__label">Redes</div>
                  <div className="loc__value loc__socials">
                    {instagram && (
                      <a className="loc__social" href={instagram} target="_blank" rel="noreferrer">
                        <IconInstagram size={16} /> Instagram
                      </a>
                    )}
                    {tiktok && (
                      <a className="loc__social" href={tiktok} target="_blank" rel="noreferrer">
                        <IconTikTok size={16} /> TikTok
                      </a>
                    )}
                    {enlaceWa && (
                      <a className="loc__social" href={enlaceWa} target="_blank" rel="noreferrer">
                        <IconWhatsApp size={16} /> WhatsApp
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