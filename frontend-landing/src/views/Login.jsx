import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import GoogleButton from '../components/GoogleButton.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const VACIO_REGISTRO = {
  nombre: '',
  email: '',
  telefono: '',
  fechaNacimiento: '',
  password: '',
  confirmar: ''
}

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { cliente, iniciarSesion, registrarse, entrarConGoogle } = useAuth()
  const [modo, setModo] = useState('login')
  const [login, setLogin] = useState({ identificador: '', password: '' })
  const [registro, setRegistro] = useState(VACIO_REGISTRO)
  const [error, setError] = useState(null)
  const [enviando, setEnviando] = useState(false)

  const destino = location.state?.from
    ? `${location.state.from.pathname}${location.state.from.search || ''}`
    : '/reservar'

  useEffect(() => {
    if (cliente) {
      navigate(destino, { replace: true })
    }
  }, [cliente, destino, navigate])

  const cambiarModo = (nuevo) => {
    setModo(nuevo)
    setError(null)
  }

  const enviarLogin = async (event) => {
    event.preventDefault()
    setError(null)
    setEnviando(true)
    try {
      await iniciarSesion(login)
      navigate(destino, { replace: true })
    } catch (err) {
      setError(err?.response?.data?.message || 'No pudimos iniciar sesión')
    } finally {
      setEnviando(false)
    }
  }

  const enviarRegistro = async (event) => {
    event.preventDefault()
    setError(null)
    if (registro.password !== registro.confirmar) {
      setError('Las contraseñas no coinciden')
      return
    }
    setEnviando(true)
    try {
      await registrarse({
        nombre: registro.nombre,
        email: registro.email,
        telefono: registro.telefono,
        fechaNacimiento: registro.fechaNacimiento,
        password: registro.password
      })
      navigate(destino, { replace: true })
    } catch (err) {
      setError(err?.response?.data?.message || 'No pudimos crear tu cuenta')
    } finally {
      setEnviando(false)
    }
  }

  const conectarGoogle = async (credential) => {
    setError(null)
    if (modo === 'registro' && (!registro.telefono || !registro.fechaNacimiento)) {
      setError('Para crear tu cuenta con Google, completa tu teléfono y fecha de nacimiento')
      return
    }
    setEnviando(true)
    try {
      await entrarConGoogle({
        credential,
        telefono: registro.telefono || undefined,
        fechaNacimiento: registro.fechaNacimiento || undefined
      })
      navigate(destino, { replace: true })
    } catch (err) {
      setError(err?.response?.data?.message || 'No pudimos entrar con Google')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      <Navbar />
      <main>
        <section className="auth container">
          <div className="auth__card">
            <span className="wizard__label">Tu cuenta DERON CUTS</span>
            <h1 className="auth__title">
              {modo === 'login' ? 'Entra y reserva' : 'Crea tu cuenta'}
            </h1>
            <p className="auth__sub">
              Reserva con tu cuenta y accede al corte gratis durante la semana de tu cumpleaños.
            </p>

            <div className="auth__tabs">
              <button
                type="button"
                className={`auth__tab${modo === 'login' ? ' auth__tab--active' : ''}`}
                onClick={() => cambiarModo('login')}
              >
                Ingresar
              </button>
              <button
                type="button"
                className={`auth__tab${modo === 'registro' ? ' auth__tab--active' : ''}`}
                onClick={() => cambiarModo('registro')}
              >
                Crear cuenta
              </button>
            </div>

            {modo === 'login' ? (
              <form className="auth__form" onSubmit={enviarLogin}>
                <div className="field">
                  <label htmlFor="identificador">Correo o teléfono</label>
                  <input
                    id="identificador"
                    autoComplete="username"
                    value={login.identificador}
                    onChange={(e) => setLogin((c) => ({ ...c, identificador: e.target.value }))}
                    placeholder="tucorreo@ejemplo.com o +51 999 888 777"
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="password-login">Contraseña</label>
                  <input
                    id="password-login"
                    type="password"
                    autoComplete="current-password"
                    value={login.password}
                    onChange={(e) => setLogin((c) => ({ ...c, password: e.target.value }))}
                    required
                  />
                </div>
                {error && <div className="alert">{error}</div>}
                <button className="btn btn--primary" type="submit" disabled={enviando}>
                  {enviando ? 'Entrando…' : 'Entrar'}
                </button>
              </form>
            ) : (
              <form className="auth__form" onSubmit={enviarRegistro}>
                <div className="field">
                  <label htmlFor="nombre">Nombre completo</label>
                  <input
                    id="nombre"
                    autoComplete="name"
                    value={registro.nombre}
                    onChange={(e) => setRegistro((c) => ({ ...c, nombre: e.target.value }))}
                    placeholder="Ej: Carlos Pérez"
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="email">Correo</label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={registro.email}
                    onChange={(e) => setRegistro((c) => ({ ...c, email: e.target.value }))}
                    placeholder="tucorreo@ejemplo.com"
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="telefono">WhatsApp / Teléfono</label>
                  <input
                    id="telefono"
                    type="tel"
                    autoComplete="tel"
                    value={registro.telefono}
                    onChange={(e) => setRegistro((c) => ({ ...c, telefono: e.target.value }))}
                    placeholder="+51 999 888 777"
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="nacimiento">Fecha de nacimiento</label>
                  <input
                    id="nacimiento"
                    type="date"
                    autoComplete="bday"
                    max={new Date().toISOString().slice(0, 10)}
                    value={registro.fechaNacimiento}
                    onChange={(e) => setRegistro((c) => ({ ...c, fechaNacimiento: e.target.value }))}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="password-registro">Contraseña</label>
                  <input
                    id="password-registro"
                    type="password"
                    autoComplete="new-password"
                    value={registro.password}
                    onChange={(e) => setRegistro((c) => ({ ...c, password: e.target.value }))}
                    placeholder="Mínimo 8 caracteres"
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="confirmar">Repite tu contraseña</label>
                  <input
                    id="confirmar"
                    type="password"
                    autoComplete="new-password"
                    value={registro.confirmar}
                    onChange={(e) => setRegistro((c) => ({ ...c, confirmar: e.target.value }))}
                    required
                  />
                </div>
                {error && <div className="alert">{error}</div>}
                <button className="btn btn--primary" type="submit" disabled={enviando}>
                  {enviando ? 'Creando cuenta…' : 'Crear mi cuenta'}
                </button>
              </form>
            )}

            <div className="auth__divider">
              <span>o</span>
            </div>

            <GoogleButton
              onCredential={conectarGoogle}
              disabled={
                enviando ||
                (modo === 'registro' && (!registro.telefono || !registro.fechaNacimiento))
              }
            />

            {modo === 'registro' && (
              <p className="hint">
                Para crear tu cuenta con Google, completa primero tu teléfono y fecha de
                nacimiento. El botón se activará cuando los tengas.
              </p>
            )}

            <p className="auth__foot">
              <Link to="/">Volver al inicio</Link>
              <span>·</span>
              <Link to="/reservar">Ir a reservar</Link>
            </p>
          </div>
        </section>
      </main>
      <Footer config={null} />
    </>
  )
}
