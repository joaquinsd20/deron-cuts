import { Link } from 'react-router-dom'
import { buildWhatsappLink } from '../config.js'
import { IconInstagram, IconTikTok, IconWhatsApp } from './icons.jsx'

export default function Footer({ config }) {
  const year = new Date().getFullYear()
  const instagram = config?.instagram
  const tiktok = config?.tiktok
  const wa = buildWhatsappLink(
    config?.telefono,
    `Hola ${config?.nombreBarbero || 'Yumpi'}, quiero agendar un corte en ${config?.nombreNegocio || 'DERON CUTS'}`
  )

  return (
    <footer className="footer">
      <div className="container footer__inner">
        <Link to="/" className="footer__brand">
          DERON<span>CUTS</span>
        </Link>

        <div className="footer__socials">
          {instagram && (
            <a
              className="btn btn--outline footer__social footer__social--ig"
              href={instagram}
              target="_blank"
              rel="noreferrer"
            >
              <IconInstagram />
            
            </a>
          )}
        
          {wa && (
            <a
              className="btn btn--outline footer__social footer__social--wa"
              href={wa}
              target="_blank"
              rel="noreferrer"
            >
              <IconWhatsApp />
            
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