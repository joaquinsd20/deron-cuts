import { NavLink, useNavigate } from 'react-router-dom'
import { auth } from '../services/auth.js'

const LINKS = [
  { to: '/', label: 'Inicio' },
  { to: '/calendario', label: 'Calendario' },
  { to: '/citas', label: 'Citas' },
  { to: '/pagos', label: 'Pagos' },
  { to: '/recordatorios', label: 'Recordatorios' },
  { to: '/servicios', label: 'Servicios' },
  { to: '/configuracion', label: 'Configuración' }
]

export default function Sidebar() {
  const navigate = useNavigate()
  const user = auth.getUser()

  const cerrarSesion = () => {
    auth.clear()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__name">
          DERON <span>CUTS</span>
        </div>
        <div className="sidebar__tag">Panel admin</div>
      </div>

      <nav className="sidebar__nav">
        {LINKS.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              'sidebar__link' + (isActive ? ' sidebar__link--active' : '')
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>

      {user && (
        <div className="sidebar__user">
          <div className="sidebar__user-name">{user.nombreBarbero || user.username}</div>
          <button className="sidebar__logout" onClick={cerrarSesion}>
            Cerrar sesión
          </button>
        </div>
      )}
    </aside>
  )
}