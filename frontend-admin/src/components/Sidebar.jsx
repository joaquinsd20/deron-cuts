import { useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { auth } from '../services/auth.js'
import { useInstalarApp } from '../services/pwa.js'

const ICONOS = {
  inicio: 'M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  calendario: 'M7 3v3M17 3v3M4 8h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z',
  citas: 'M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
  pagos: 'M3 7h18v10H3zM3 10h18M7 14h3',
  recordatorios: 'M6 16V11a6 6 0 1 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0',
  servicios: 'M6 6a3 3 0 1 0 0 .01M6 18a3 3 0 1 0 0 .01M8.5 7.5 20 18M8.5 16.5 20 6',
  configuracion: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-2.7-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3.6 15H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.1-2.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 9.7 4.4V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1.3z',
  mas: 'M5 12h.01M12 12h.01M19 12h.01',
  instalar: 'M12 3v12M7 10l5 5 5-5M5 21h14',
  salir: 'M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l5-5-5-5M15 12H3'
}

function Icono({ nombre }) {
  return (
    <svg className="icono" viewBox="0 0 24 24" aria-hidden="true">
      <path d={ICONOS[nombre]} />
    </svg>
  )
}

const LINKS = [
  { to: '/', label: 'Inicio', icono: 'inicio', tab: true },
  { to: '/citas', label: 'Citas', icono: 'citas', tab: true },
  { to: '/calendario', label: 'Calendario', icono: 'calendario', tab: true },
  { to: '/servicios', label: 'Servicios', icono: 'servicios', tab: true },
  { to: '/pagos', label: 'Pagos', icono: 'pagos' },
  { to: '/recordatorios', label: 'Recordatorios', icono: 'recordatorios' },
  { to: '/configuracion', label: 'Configuración', icono: 'configuracion' }
]

const claseLink = (base) => ({ isActive }) => `${base}${isActive ? ` ${base}--active` : ''}`

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = auth.getUser()
  const [masAbierto, setMasAbierto] = useState(false)
  const { puedeInstalar, instalar, esIOS, instalada } = useInstalarApp()
  const [ayudaIOS, setAyudaIOS] = useState(false)

  useEffect(() => {
    setMasAbierto(false)
  }, [location.pathname])

  const cerrarSesion = () => {
    auth.clear()
    navigate('/login', { replace: true })
  }

  const pedirInstalacion = () => {
    if (puedeInstalar) instalar()
    else if (esIOS) setAyudaIOS(true)
  }

  const mostrarInstalar = !instalada && (puedeInstalar || esIOS)
  const enMas = LINKS.some((l) => !l.tab && l.to === location.pathname)

  return (
    <>
      {/* Escritorio */}
      <aside className="sidebar">
        <div className="sidebar__brand">
          <div className="sidebar__name">
            DERON <span>CUTS</span>
          </div>
          <div className="sidebar__tag">Panel admin</div>
        </div>

        <nav className="sidebar__nav">
          {LINKS.map(({ to, label, icono }) => (
            <NavLink key={to} to={to} end={to === '/'} className={claseLink('sidebar__link')}>
              <Icono nombre={icono} />
              {label}
            </NavLink>
          ))}
        </nav>

        {user && (
          <div className="sidebar__user">
            <div className="sidebar__user-name">{user.nombreBarbero || user.username}</div>
            {mostrarInstalar && (
              <button className="sidebar__logout" onClick={pedirInstalacion}>
                Instalar app
              </button>
            )}
            <button className="sidebar__logout" onClick={cerrarSesion}>
              Cerrar sesión
            </button>
          </div>
        )}
      </aside>

      {/* Celular: cabecera compacta + barra inferior tipo app */}
      <header className="topbar">
        <div className="topbar__name">
          DERON <span>CUTS</span>
        </div>
        {user && <div className="topbar__user">{user.nombreBarbero || user.username}</div>}
      </header>

      <nav className="tabbar" aria-label="Navegación principal">
        {LINKS.filter((l) => l.tab).map(({ to, label, icono }) => (
          <NavLink key={to} to={to} end={to === '/'} className={claseLink('tabbar__item')}>
            <Icono nombre={icono} />
            <span>{label}</span>
          </NavLink>
        ))}
        <button
          type="button"
          className={`tabbar__item${enMas || masAbierto ? ' tabbar__item--active' : ''}`}
          onClick={() => setMasAbierto((v) => !v)}
          aria-expanded={masAbierto}
        >
          <Icono nombre="mas" />
          <span>Más</span>
        </button>
      </nav>

      {masAbierto && (
        <div className="sheet" role="presentation" onClick={() => setMasAbierto(false)}>
          <div className="sheet__panel" role="dialog" aria-label="Más opciones" onClick={(e) => e.stopPropagation()}>
            <div className="sheet__handle" />
            {LINKS.filter((l) => !l.tab).map(({ to, label, icono }) => (
              <NavLink key={to} to={to} className={claseLink('sheet__item')}>
                <Icono nombre={icono} />
                {label}
              </NavLink>
            ))}
            {mostrarInstalar && (
              <button type="button" className="sheet__item" onClick={pedirInstalacion}>
                <Icono nombre="instalar" />
                Instalar app en el celular
              </button>
            )}
            <button type="button" className="sheet__item sheet__item--danger" onClick={cerrarSesion}>
              <Icono nombre="salir" />
              Cerrar sesión
            </button>
          </div>
        </div>
      )}

      {ayudaIOS && (
        <div className="sheet" role="presentation" onClick={() => setAyudaIOS(false)}>
          <div className="sheet__panel" role="dialog" aria-label="Instalar en iPhone" onClick={(e) => e.stopPropagation()}>
            <div className="sheet__handle" />
            <div className="sheet__title">Instalar en iPhone</div>
            <ol className="sheet__pasos">
              <li>Abre este panel en <b>Safari</b>.</li>
              <li>Toca el botón <b>Compartir</b> (cuadrado con flecha hacia arriba).</li>
              <li>Elige <b>Agregar a pantalla de inicio</b> y luego <b>Agregar</b>.</li>
            </ol>
            <button type="button" className="btn btn--primary" onClick={() => setAyudaIOS(false)}>
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  )
}
