import { Link } from 'react-router-dom'

export default function Footer({ config }) {
  const year = new Date().getFullYear()
  const instagram = config?.instagram
  const tiktok = config?.tiktok

  return (
    <footer className="footer">
      <div className="container footer__inner">
        <Link to="/" className="footer__brand">
          DERON<span>CUTS</span>
        </Link>

        <div className="footer__socials">
          {instagram && (
            <a className="btn btn--outline" href={instagram} target="_blank" rel="noreferrer">
              Instagram
            </a>
          )}
          {tiktok && (
            <a className="btn btn--outline" href={tiktok} target="_blank" rel="noreferrer">
              TikTok
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