import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import AvisosCita from '../components/AvisosCita.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { getMisCitas, cancelarCita, cambiarPassword, getConfiguracion, reportarPago } from '../services/api.js'
import PagoAdelanto from '../components/PagoAdelanto.jsx'
import { formatCurrency, formatFechaLarga } from '../config.js'

export default function Cuenta() {
  const navigate = useNavigate()
  const { cliente, cerrarSesion } = useAuth()
  const [citas, setCitas] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    getMisCitas()
      .then(setCitas)
      .catch(() => setCitas([]))
      .finally(() => setCargando(false))
  }, [])

  // Pagar el adelanto de una cita ya creada (o reenviar la captura).
  const [config, setConfig] = useState(null)
  const [pagando, setPagando] = useState(null)
  const [pagoCita, setPagoCita] = useState({ metodo: 'YAPE', operacion: '', comprobante: null })
  const [errorPagoCita, setErrorPagoCita] = useState(null)
  const [enviandoPago, setEnviandoPago] = useState(false)

  useEffect(() => {
    getConfiguracion().then(setConfig).catch(() => {})
  }, [])

  const necesitaPago = (cita) =>
    (cita.estado === 'PENDIENTE' || cita.estado === 'CONFIRMADA') &&
    !cita.adelantoPagado &&
    Number(cita.adelantoMonto) > 0 &&
    new Date(cita.fechaHoraInicio) > new Date()

  const enviarPagoCita = async (cita) => {
    if (!pagoCita.operacion.trim() && !pagoCita.comprobante) {
      setErrorPagoCita('Sube la captura o escribe el número de operación.')
      return
    }
    setEnviandoPago(true)
    try {
      const actualizada = await reportarPago(cita.id, {
        metodoPago: pagoCita.metodo,
        numeroOperacion: pagoCita.operacion.trim() || null,
        comprobante: pagoCita.comprobante
      })
      setCitas((lista) => lista.map((c) => (c.id === actualizada.id ? actualizada : c)))
      setPagando(null)
    } catch (err) {
      setErrorPagoCita(err?.response?.data?.message || 'No pudimos enviar tu pago. Inténtalo de nuevo.')
    } finally {
      setEnviandoPago(false)
    }
  }

  const [cancelando, setCancelando] = useState(null)
  const [errorCancelar, setErrorCancelar] = useState(null)

  const puedeCancelar = (cita) =>
    (cita.estado === 'PENDIENTE' || cita.estado === 'CONFIRMADA') &&
    new Date(cita.fechaHoraInicio) > new Date()

  const cancelar = async (cita) => {
    const aviso =
      cita.adelantoPagado && cita.adelantoMonto > 0
        ? '\n\nTu adelanto ya fue recibido: coordina la devolución por WhatsApp.'
        : ''
    if (!window.confirm(`¿Cancelar tu cita de ${cita.nombreServicio}?${aviso}`)) return
    setCancelando(cita.id)
    setErrorCancelar(null)
    try {
      const actualizada = await cancelarCita(cita.id)
      setCitas((lista) => lista.map((c) => (c.id === actualizada.id ? actualizada : c)))
    } catch (err) {
      setErrorCancelar(err?.response?.data?.message || 'No pudimos cancelar la cita. Inténtalo de nuevo.')
    } finally {
      setCancelando(null)
    }
  }

  const [pwdAbierto, setPwdAbierto] = useState(false)
  const [pwd, setPwd] = useState({ actual: '', nueva: '', repetir: '' })
  const [pwdMsg, setPwdMsg] = useState(null)
  const [pwdGuardando, setPwdGuardando] = useState(false)

  const guardarPassword = async (e) => {
    e.preventDefault()
    if (pwd.nueva.length < 8) return setPwdMsg({ error: true, texto: 'Mínimo 8 caracteres.' })
    if (pwd.nueva !== pwd.repetir) return setPwdMsg({ error: true, texto: 'Las contraseñas no coinciden.' })
    setPwdGuardando(true)
    setPwdMsg(null)
    try {
      await cambiarPassword(pwd.actual || null, pwd.nueva)
      setPwd({ actual: '', nueva: '', repetir: '' })
      setPwdMsg({ error: false, texto: 'Contraseña actualizada.' })
    } catch (err) {
      setPwdMsg({ error: true, texto: err?.response?.data?.message || 'No se pudo cambiar la contraseña.' })
    } finally {
      setPwdGuardando(false)
    }
  }

  const salir = () => {
    cerrarSesion()
    navigate('/')
  }

  return (
    <>
      <Navbar />
      <main>
        <section className="account container">
          <header className="booking__head">
            <span className="wizard__label">Mi cuenta</span>
            <h1 className="booking__title">{cliente?.nombre}</h1>
            <p className="booking__sub">
              {cliente?.email} · {cliente?.telefono}
            </p>
          </header>

          <div className="account__grid">
            <div className="account__card">
              <div className="aside__title">Tus datos</div>
              <div className="aside__row">
                <span>Nombre</span>
                <b>{cliente?.nombre}</b>
              </div>
              <div className="aside__row">
                <span>Correo</span>
                <span className="val">{cliente?.email}</span>
              </div>
              <div className="aside__row">
                <span>Teléfono</span>
                <span className="val">{cliente?.telefono}</span>
              </div>
              <div className="aside__row">
                <span>Cumpleaños</span>
                <span className="val">
                  {cliente?.fechaNacimiento ? formatFechaLarga(cliente.fechaNacimiento) : '—'}
                </span>
              </div>
              <div className="aside__row">
                <span>Google</span>
                <span className="val">{cliente?.googleVinculado ? 'Vinculado' : 'No vinculado'}</span>
              </div>
              <div className="account__actions">
                <Link to="/reservar" className="btn btn--primary">
                  Reservar un corte
                </Link>
                <button type="button" className="btn btn--outline" onClick={salir}>
                  Cerrar sesión
                </button>
              </div>
              <button type="button" className="auth__olvido" onClick={() => setPwdAbierto((v) => !v)}>
                {pwdAbierto ? 'Ocultar' : 'Cambiar mi contraseña'}
              </button>
              {pwdAbierto && (
                <form className="auth__form" onSubmit={guardarPassword}>
                  {cliente?.tienePassword !== false && (
                    <div className="field">
                      <label htmlFor="pwd-actual">Contraseña actual (o la clave temporal)</label>
                      <input
                        id="pwd-actual"
                        type="password"
                        autoComplete="current-password"
                        value={pwd.actual}
                        onChange={(e) => setPwd((p) => ({ ...p, actual: e.target.value }))}
                      />
                    </div>
                  )}
                  <div className="field">
                    <label htmlFor="pwd-nueva">Nueva contraseña</label>
                    <input
                      id="pwd-nueva"
                      type="password"
                      autoComplete="new-password"
                      value={pwd.nueva}
                      onChange={(e) => setPwd((p) => ({ ...p, nueva: e.target.value }))}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="pwd-repetir">Repite la nueva contraseña</label>
                    <input
                      id="pwd-repetir"
                      type="password"
                      autoComplete="new-password"
                      value={pwd.repetir}
                      onChange={(e) => setPwd((p) => ({ ...p, repetir: e.target.value }))}
                    />
                  </div>
                  {pwdMsg && <div className={pwdMsg.error ? 'alert' : 'policy policy--ok'}>{pwdMsg.texto}</div>}
                  <button type="submit" className="btn btn--primary" disabled={pwdGuardando}>
                    {pwdGuardando ? 'Guardando…' : 'Guardar contraseña'}
                  </button>
                </form>
              )}
              <div className="policy">
                <b>Cumpleaños:</b> corte gratis durante la semana de tu cumpleaños.
                <br />
                <b>Reservas:</b> 50% de adelanto. Tolerancia de 15 minutos; después se pierde
                el adelanto y se suman S/ 10.
              </div>
            </div>

            <div className="account__card">
              <div className="aside__title">Mis citas</div>
              <AvisosCita />
              {errorCancelar && <div className="alert">{errorCancelar}</div>}
              {cargando ? (
                <div className="spinner" />
              ) : citas.length === 0 ? (
                <div className="empty">Todavía no tienes citas reservadas.</div>
              ) : (
                <div className="account__citas">
                  {citas.map((cita) => (
                    <article className="account__cita" key={cita.id}>
                      <div className="account__cita-head">
                        <b>{cita.nombreServicio}</b>
                        <span className={`account__badge account__badge--${(cita.estado || '').toLowerCase()}`}>
                          {cita.estado}
                        </span>
                      </div>
                      <div className="account__cita-meta">
                        {formatFechaLarga(cita.fechaHoraInicio)} · {cita.fechaHoraInicio?.slice(11, 16)}
                      </div>
                      <div className="account__cita-meta">
                        {cita.descuentoCumpleanos ? 'Cumpleaños: gratis' : `Precio: ${formatCurrency(cita.precioFinal)}`}
                        {cita.adelantoMonto > 0 && (
                          <>
                            {' · '}Adelanto {formatCurrency(cita.adelantoMonto)}:{' '}
                            {cita.adelantoPagado
                              ? 'recibido'
                              : cita.pagoOperacion || cita.comprobanteEnviado
                                ? 'en verificación'
                                : 'pendiente'}
                          </>
                        )}
                        {cita.saldoPendiente > 0 && (
                          <>
                            {' · '}Pendiente {formatCurrency(cita.saldoPendiente)}
                          </>
                        )}
                        {cita.tardanzaAplicada && (
                          <>
                            {' · '}Tardanza +{formatCurrency(cita.penalidadTardanza)}
                          </>
                        )}
                      </div>
                      {necesitaPago(cita) && pagando !== cita.id && (
                        <button
                          type="button"
                          className="btn btn--primary account__pagar"
                          onClick={() => {
                            setPagando(cita.id)
                            setPagoCita({ metodo: 'YAPE', operacion: '', comprobante: null })
                            setErrorPagoCita(null)
                          }}
                        >
                          {cita.pagoOperacion || cita.comprobanteEnviado
                            ? 'Reenviar pago'
                            : `Pagar adelanto (${formatCurrency(cita.adelantoMonto)})`}
                        </button>
                      )}
                      {pagando === cita.id && config && (
                        <>
                          <PagoAdelanto
                            monto={cita.adelantoMonto}
                            config={config}
                            valor={pagoCita}
                            onChange={(v) => {
                              setPagoCita(v)
                              setErrorPagoCita(null)
                            }}
                            error={errorPagoCita}
                          />
                          <div className="account__actions">
                            <button
                              type="button"
                              className="btn btn--primary"
                              onClick={() => enviarPagoCita(cita)}
                              disabled={enviandoPago}
                            >
                              {enviandoPago ? 'Enviando…' : 'Ya pagué, enviar'}
                            </button>
                            <button type="button" className="btn btn--outline" onClick={() => setPagando(null)}>
                              Cerrar
                            </button>
                          </div>
                        </>
                      )}
                      {puedeCancelar(cita) && (
                        <button
                          type="button"
                          className="btn btn--outline account__cancel"
                          onClick={() => cancelar(cita)}
                          disabled={cancelando === cita.id}
                        >
                          {cancelando === cita.id ? 'Cancelando…' : 'Cancelar cita'}
                        </button>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer config={null} />
    </>
  )
}
