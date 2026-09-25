import { Link } from 'react-router-dom'
import { buildWhatsappLink } from '../config.js'

export default function Footer({ config }) {
  const year = new Date().getFullYear()
  const instagram = config?.instagram
  const wa = buildWhatsappLink(
    config?.telefono,
    `Hola ${config?.nombreBarbero || 'Yumpi'}, quiero agendar un corte en ${config?.nombreNegocio || 'DERON CUTS'}`
  )

  return (
    <footer className="footer">
      <div className="container footer__inner">
        <Link to="/" className="footer__brand">
          <img src="/logo.jpg" alt="DERON CUTS" />
        </Link>

        <div className="footer__socials">
          {instagram && (
            <a className="btn btn--outline" href={instagram} target="_blank" rel="noreferrer">
              Instagram
            </a>
          )}
          {wa && (
            <a className="btn btn--outline" href={wa} target="_blank" rel="noreferrer">
              Whatsapp
            </a>
          )}
        </div>

        <p className="footer__copy">
          © {year} DERON CUTS 
        </p>
      </div>
    </footer>
  )
}