import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { cliente, cerrarSesion } = useAuth()
  const onHome = location.pathname === '/'
  const [compacta, setCompacta] = useState(false)
  const [activa, setActiva] = useState(null)
  const progresoRef = useRef(null)

  // Navbar compacta al bajar, barra de progreso y sección activa (solo en el inicio).
  useEffect(() => {
    let frame = 0
    const secciones = ['servicios', 'yumpi', 'ubicacion']
    const actualizar = () => {
      frame = 0
      const y = window.scrollY
      setCompacta(y > 40)
      const total = document.documentElement.scrollHeight - window.innerHeight
      if (progresoRef.current) {
        progresoRef.current.style.transform = `scaleX(${total > 0 ? Math.min(1, y / total) : 0})`
      }
      if (!onHome) return
      const linea = window.innerHeight * 0.35
      let actual = null
      secciones.forEach((id) => {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= linea) actual = id
      })
      setActiva(actual)
    }
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(actualizar)
    }
    actualizar()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [onHome])

  const claseLink = (id) => `nav__link${activa === id ? ' nav__link--active' : ''}`

  useEffect(() => {
    if (!open) return

    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)

    return () => {
      document.body.style.overflow = overflow
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  const anchor = (id) => {
    setOpen(false)
    if (onHome) {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    } else {
      window.location.href = `/#${id}`
    }
  }

  const salir = () => {
    setOpen(false)
    cerrarSesion()
    navigate('/')
  }

  return (
    <header className={`navbar${compacta ? ' navbar--compacta' : ''}`}>
      <div className="container navbar__inner">
        <Link to="/" className="brand" onClick={() => setOpen(false)}>
          <span className="brand__name">
            DERON<span>CUTS</span>
          </span>
          <span className="brand__tag">Barber Studio</span>
        </Link>

        <nav id="menu-principal" className={`nav__list${open ? ' nav__list--open' : ''}`} aria-label="Menú principal">
          <span className="nav__eyebrow" aria-hidden="true">Menú</span>
          <div className="nav__item nav__drop">
            <a className={claseLink('servicios')} href="#servicios" onClick={() => anchor('servicios')}>
              Servicios
            </a>
            
          </div>
          <div className="nav__item">
            <a className={claseLink('yumpi')} href="#yumpi" onClick={() => anchor('yumpi')}>
              Sobre Yumpi
            </a>
          </div>
          <div className="nav__item">
            <a className={claseLink('ubicacion')} href="#ubicacion" onClick={() => anchor('ubicacion')}>
              Ubicación
            </a>
          </div>
          {cliente ? (
            <>
              <div className="nav__item">
                <Link to="/cuenta" className="nav__link" onClick={() => setOpen(false)}>
                  Mi cuenta
                </Link>
              </div>
              <div className="nav__item">
                <button type="button" className="nav__link nav__logout" onClick={salir}>
                  Salir
                </button>
              </div>
            </>
          ) : (
            <div className="nav__item">
              <Link to="/login" className="nav__link" onClick={() => setOpen(false)}>
                Ingresar
              </Link>
            </div>
          )}
          <div className="nav__item nav__cta-wrap">
            <Link to="/reservar" className="btn btn--primary nav__cta" onClick={() => setOpen(false)}>
              Reservar ahora
            </Link>
          </div>
        </nav>

        <button
          className={`nav__toggle${open ? ' nav__toggle--open' : ''}`}
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={open}
          aria-controls="menu-principal"
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
      <div className="navbar__progreso" ref={progresoRef} aria-hidden="true" />
    </header>
  )
}