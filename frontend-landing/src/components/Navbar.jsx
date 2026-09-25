import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const onHome = location.pathname === '/'

  const anchor = (id) => {
    setOpen(false)
    if (onHome) {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    } else {
      window.location.href = `/#${id}`
    }
  }

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <Link to="/" className="brand" onClick={() => setOpen(false)}>
          <span className="brand__name">
            DERON<span>CUTS</span>
          </span>
          <span className="brand__tag">Barber Studio</span>
        </Link>

        <nav className={`nav__list${open ? ' nav__list--open' : ''}`}>
          <div className="nav__item nav__drop">
            <a className="nav__link" href="#servicios" onClick={() => anchor('servicios')}>
              Cortes
            </a>
            <div className="nav__drop-menu">
              <a className="nav__drop-link" href="#servicios" onClick={() => anchor('servicios')}>
                Low Fade
              </a>
              <a className="nav__drop-link" href="#servicios" onClick={() => anchor('servicios')}>
                Drop Fade
              </a>
              <a className="nav__drop-link" href="#servicios" onClick={() => anchor('servicios')}>
                Taper Fade
              </a>
              <a className="nav__drop-link" href="#servicios" onClick={() => anchor('servicios')}>
                Mid Taper Fade
              </a>
            </div>
          </div>
          <div className="nav__item">
            <a className="nav__link" href="#yumpi" onClick={() => anchor('yumpi')}>
              Sobre Yumpi
            </a>
          </div>
          <div className="nav__item">
            <a className="nav__link" href="#ubicacion" onClick={() => anchor('ubicacion')}>
              Ubicación
            </a>
          </div>
          <div className="nav__item nav__cta-wrap">
            <Link to="/reservar" className="btn btn--primary nav__cta" onClick={() => setOpen(false)}>
              Reservar ahora
            </Link>
          </div>
        </nav>

        <button
          className="nav__toggle"
          aria-label="Abrir menú"
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>
    </header>
  )
}