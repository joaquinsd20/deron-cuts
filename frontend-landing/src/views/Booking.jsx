import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import {
  getConfiguracion,
  getServicios,
  getDisponibilidad,
  crearCita
} from '../services/api.js'
import {
  formatCurrency,
  ES_DAYS,
  ES_MONTHS,
  dayKey,
  addDays,
  buildWhatsappLink
} from '../config.js'

const PHONE_RE = /^\+?[0-9\s()\-]{6,30}$/

export default function Booking() {
  const [searchParams] = useSearchParams()
  const preServicio = searchParams.get('servicio')

  const [config, setConfig] = useState(null)
  const [servicios, setServicios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [errorData, setErrorData] = useState(false)

  const [step, setStep] = useState(1)
  const [servicioId, setServicioId] = useState(null)
  const [fecha, setFecha] = useState(null)
  const [horarios, setHorarios] = useState([])
  const [cargandoHorarios, setCargandoHorarios] = useState(false)
  const [hora, setHora] = useState(null)
  const [cliente, setCliente] = useState({ nombre: '', whatsapp: '', email: '', notas: '' })
  const [errores, setErrores] = useState({})
  const [enviando, setEnviando] = useState(false)
  const [errorSubmit, setErrorSubmit] = useState(null)
  const [creada, setCreada] = useState(null)

  useEffect(() => {
    Promise.all([getConfiguracion(), getServicios()])
      .then(([cfg, svc]) => {
        setConfig(cfg)
        setServicios(svc)
        const preId = Number(preServicio)
        if (preId && svc.some((s) => s.id === preId)) {
          setServicioId(preId)
          setStep(2)
        }
      })
      .catch(() => setErrorData(true))
      .finally(() => setCargando(false))
  }, [preServicio])

  const dias = useCallback(() => {
    const hoy = new Date()
    return Array.from({ length: 14 }, (_, i) => addDays(hoy, i))
  }, [])

  const diaAbierto = useCallback(
    (date) => {
      if (!config) return false
      const data = config.horario?.[dayKey(date)]
      return !!(data && data.activo && data.abre)
    },
    [config]
  )

  useEffect(() => {
    if (!fecha || !servicioId || !config) return
    setCargandoHorarios(true)
    setHora(null)
    getDisponibilidad(fecha, servicioId)
      .then((r) => setHorarios(r.horarios || []))
      .catch(() => setHorarios([]))
      .finally(() => setCargandoHorarios(false))
  }, [fecha, servicioId, config])

  const servicio = servicios.find((s) => s.id === servicioId)
  const fechaObj = fecha ? new Date(`${fecha}T00:00:00`) : null

  const decidirDatoHora = (h, campo, valor) => {
    setCliente((c) => ({ ...c, [campo]: valor }))
    const nuevosErrores = { ...errores }
    delete nuevosErrores[campo]
    setErrores(nuevosErrores)
  }

  const validarPaso = () => {
    const nuevosErrores = {}

    if (step === 1 && !servicioId) {
      nuevosErrores.servicio = 'Elige un servicio para continuar.'
    }

    if (step === 2) {
      if (!fecha) nuevosErrores.fecha = 'Elige una fecha.'
      if (!hora) nuevosErrores.hora = 'Elige un horario disponible.'
    }

    if (step === 3) {
      if (!cliente.nombre.trim() || cliente.nombre.trim().length < 3) {
        nuevosErrores.nombre = 'Escribe tu nombre completo.'
      }
      if (!cliente.whatsapp.trim()) {
        nuevosErrores.whatsapp = 'Escribe tu WhatsApp o teléfono.'
      } else if (!PHONE_RE.test(cliente.whatsapp.trim())) {
        nuevosErrores.whatsapp = 'El número no parece válido.'
      }
      if (cliente.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cliente.email)) {
        nuevosErrores.email = 'Ese correo no es válido.'
      }
    }

    setErrores(nuevosErrores)
    return Object.keys(nuevosErrores).length === 0
  }

  const continuar = () => {
    if (!validarPaso()) return
    if (step < 3) {
      setStep(step + 1)
    } else {
      enviar()
    }
  }

  const atras = () => {
    if (step > 1) setStep(step - 1)
  }

  const enviar = () => {
    setEnviando(true)
    setErrorSubmit(null)
    crearCita({
      servicioId,
      nombreCliente: cliente.nombre.trim(),
      telefonoWhatsapp: cliente.whatsapp.trim(),
      email: cliente.email.trim() || null,
      notas: cliente.notas.trim() || null,
      fechaHoraInicio: `${fecha}T${hora}:00`
    })
      .then((cita) => setCreada(cita))
      .catch((err) => {
        const msg = err?.response?.data?.message || 'No pudimos agendar tu cita. Inténtalo de nuevo.'
        setErrorSubmit(msg)
      })
      .finally(() => setEnviando(false))
  }

  if (cargando) {
    return (
      <>
        <Navbar />
        <div className="booking container">
          <div className="spinner" />
        </div>
        <Footer config={null} />
      </>
    )
  }

  if (errorData) {
    return (
      <>
        <Navbar />
        <div className="error-state container">
          <h2>No pudimos cargar la información</h2>
          <p>Revisa que el backend de DERON CUTS esté corriendo y vuelve a intentarlo.</p>
          <Link to="/" className="btn btn--outline">
            Volver al inicio
          </Link>
        </div>
        <Footer config={null} />
      </>
    )
  }

  if (creada) {
    return (
      <>
        <Navbar />
        <main>
          <section className="booking">
            <div className="container">
              <div className="success">
                <div className="success__badge">OK</div>
                <h1 className="success__title">Cita agendada</h1>
                <p className="success__copy">
                  Gracias, <b>{creada.nombreCliente}</b>. Te esperamos en DERON CUTS. Si necesitas
                  cambiar algo, escríbenos por WhatsApp.
                </p>
              </div>

              <div className="wizard">
                <div className="wizard__main">
                  <div className="summary">
                    <div className="summary__row">
                      <span className="k">Servicio</span>
                      <span className="v">{creada.nombreServicio}</span>
                    </div>
                    <div className="summary__row">
                      <span className="k">Precio</span>
                      <span className="v">{formatCurrency(creada.precioServicio)}</span>
                    </div>
                    <div className="summary__row">
                      <span className="k">Fecha y hora</span>
                      <span className="v">
                        {formatFecha(creada.fechaHoraInicio)} · {horaHora(creada.fechaHoraInicio)}
                      </span>
                    </div>
                    <div className="summary__row">
                      <span className="k">Duración</span>
                      <span className="v">{creada.duracionMinutos} minutos</span>
                    </div>
                    <div className="summary__row summary__row--accent">
                      <span className="k">Barbero</span>
                      <span className="v">{config.nombreBarbero}</span>
                    </div>
                    <div className="summary__row summary__row--accent">
                      <span className="k">Ubicación</span>
                      <span className="v">{config.direccion}</span>
                    </div>
                  </div>

                  <div className="hero__actions" style={{ marginTop: 24 }}>
                    {buildWhatsappLink(
                      config.telefono,
                      `Hola ${config.nombreBarbero}, acabo de reservar "${creada.nombreServicio}" el ${formatFecha(creada.fechaHoraInicio)} a las ${horaHora(creada.fechaHoraInicio)}`
                    ) && (
                      <a
                        className="btn btn--primary"
                        href={buildWhatsappLink(
                          config.telefono,
                          `Hola ${config.nombreBarbero}, acabo de reservar "${creada.nombreServicio}" el ${formatFecha(creada.fechaHoraInicio)} a las ${horaHora(creada.fechaHoraInicio)}`
                        )}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Confirmar por WhatsApp
                      </a>
                    )}
                    <Link to="/" className="btn btn--outline">
                      Volver al inicio
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
        <Footer config={config} />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main>
        <section className="booking" id="top">
          <div className="container">
            <div className="booking__head">
              <h1 className="booking__title">Reserva tu corte</h1>
              <p className="booking__sub">
                Cuatro pasos, un minuto. Tu cita queda agendada con {config.nombreBarbero} en{' '}
                {config.nombreNegocio}.
              </p>
            </div>

            <div className="progress" aria-label="Progreso">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className={`progress__step${n < step ? ' progress__step--done' : ''}${n === step ? ' progress__step--current' : ''}`}
                />
              ))}
            </div>

            <div className="wizard">
              <div className="wizard__main">
                {step === 1 && (
                  <>
                    <span className="wizard__label">Paso 1 de 4</span>
                    <h2 className="wizard__title">Elige tu servicio</h2>
                    <div className="pick-grid">
                      {servicios.map((svc) => (
                        <button
                          key={svc.id}
                          type="button"
                          className={`pick${servicioId === svc.id ? ' pick--selected' : ''}`}
                          onClick={() => setServicioId(svc.id)}
                        >
                          <div className="pick__name">{svc.nombre}</div>
                          <div className="pick__desc">{svc.descripcion}</div>
                          <div className="pick__foot">
                            <span className="pick__price">{formatCurrency(svc.precio)}</span>
                            <span className="pick__dur">{svc.duracionMinutos} min</span>
                          </div>
                        </button>
                      ))}
                    </div>
                    {errores.servicio && <div className="alert">{errores.servicio}</div>}
                  </>
                )}

                {step === 2 && (
                  <>
                    <span className="wizard__label">Paso 2 de 4</span>
                    <h2 className="wizard__title">Fecha y hora</h2>
                    <p className="wizard__sub">
                      Servicio: <b>{servicio?.nombre}</b> ({servicio?.duracionMinutos} min)
                    </p>

                    <div className="date-strip">
                      {dias().map((d) => {
                        const abierto = diaAbierto(d)
                        const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                        return (
                          <button
                            key={iso}
                            type="button"
                            className={`date-cell${fecha === iso ? ' date-cell--selected' : ''}${!abierto ? ' date-cell--off' : ''}`}
                            disabled={!abierto}
                            onClick={() => setFecha(iso)}
                          >
                            <div className="date-cell__dow">{ES_DAYS[d.getDay()]}</div>
                            <div className="date-cell__num">{d.getDate()}</div>
                            <div className="date-cell__mon">{ES_MONTHS[d.getMonth()]}</div>
                          </button>
                        )
                      })}
                    </div>

                    {fecha && (
                      <div className="time-grid">
                        {cargandoHorarios && <div className="hint">Consultando horarios…</div>}
                        {!cargandoHorarios && horarios.length === 0 && (
                          <div className="hint">
                            No quedan horarios libres ese día. Prueba con otra fecha.
                          </div>
                        )}
                        {!cargandoHorarios &&
                          horarios.map((h) => (
                            <button
                              key={h}
                              type="button"
                              className={`time-btn${hora === h ? ' time-btn--selected' : ''}`}
                              onClick={() => setHora(h)}
                            >
                              {h}
                            </button>
                          ))}
                      </div>
                    )}

                    {fecha && cargandoHorarios && <div className="spinner" style={{ marginTop: 18 }} />}
                    {errores.fecha && <div className="alert">{errores.fecha}</div>}
                    {errores.hora && <div className="alert">{errores.hora}</div>}
                  </>
                )}

                {step === 3 && (
                  <>
                    <span className="wizard__label">Paso 3 de 4</span>
                    <h2 className="wizard__title">Tus datos</h2>
                    <div className="wizard__form" style={{ display: 'grid', gap: 18, marginTop: 24 }}>
                      <div className={`field${errores.nombre ? ' field--error' : ''}`}>
                        <label htmlFor="nombre">
                          Nombre completo <span className="req">*</span>
                        </label>
                        <input
                          id="nombre"
                          type="text"
                          placeholder="Ej: Carlos Pérez"
                          value={cliente.nombre}
                          onChange={(e) => decidirDatoHora(e, 'nombre', e.target.value)}
                        />
                        {errores.nombre && <span className="field__error">{errores.nombre}</span>}
                      </div>

                      <div className={`field${errores.whatsapp ? ' field--error' : ''}`}>
                        <label htmlFor="whatsapp">
                          WhatsApp / Teléfono <span className="req">*</span>
                        </label>
                        <input
                          id="whatsapp"
                          type="tel"
                          placeholder="Ej: +51 999 888 777"
                          value={cliente.whatsapp}
                          onChange={(e) => decidirDatoHora(e, 'whatsapp', e.target.value)}
                        />
                        {errores.whatsapp && <span className="field__error">{errores.whatsapp}</span>}
                      </div>

                      <div className={`field${errores.email ? ' field--error' : ''}`}>
                        <label htmlFor="email">Correo (opcional)</label>
                        <input
                          id="email"
                          type="email"
                          placeholder="tucorreo@ejemplo.com"
                          value={cliente.email}
                          onChange={(e) => decidirDatoHora(e, 'email', e.target.value)}
                        />
                        {errores.email && <span className="field__error">{errores.email}</span>}
                      </div>

                      <div className="field">
                        <label htmlFor="notas">Notas (opcional)</label>
                        <textarea
                          id="notas"
                          rows="3"
                          placeholder="Cuéntale a Yumpi qué estilo quieres…"
                          value={cliente.notas}
                          onChange={(e) => decidirDatoHora(e, 'notas', e.target.value)}
                        />
                      </div>
                    </div>
                  </>
                )}

                {step === 4 && (
                  <>
                    <span className="wizard__label">Paso 4 de 4</span>
                    <h2 className="wizard__title">Revisa y confirma</h2>
                    <div className="summary">
                      <div className="summary__row">
                        <span className="k">Servicio</span>
                        <span className="v">{servicio?.nombre}</span>
                      </div>
                      <div className="summary__row">
                        <span className="k">Precio</span>
                        <span className="v">{formatCurrency(servicio?.precio)}</span>
                      </div>
                      <div className="summary__row">
                        <span className="k">Fecha</span>
                        <span className="v">{fechaObj ? formatFecha(fecha) : '—'}</span>
                      </div>
                      <div className="summary__row">
                        <span className="k">Hora</span>
                        <span className="v">{hora || '—'}</span>
                      </div>
                      <div className="summary__row">
                        <span className="k">Duración</span>
                        <span className="v">{servicio?.duracionMinutos} minutos</span>
                      </div>
                      <div className="summary__row summary__row--accent">
                        <span className="k">Cliente</span>
                        <span className="v">{cliente.nombre}</span>
                      </div>
                      <div className="summary__row summary__row--accent">
                        <span className="k">Contacto</span>
                        <span className="v">{cliente.whatsapp}</span>
                      </div>
                      <div className="summary__row summary__row--accent">
                        <span className="k">Barbero</span>
                        <span className="v">{config.nombreBarbero}</span>
                      </div>
                      <div className="summary__row summary__row--accent">
                        <span className="k">Ubicación</span>
                        <span className="v">{config.direccion}</span>
                      </div>
                    </div>
                    {errorSubmit && <div className="alert">{errorSubmit}</div>}
                  </>
                )}

                <div className="hero__actions" style={{ marginTop: 30 }}>
                  {step > 1 && (
                    <button type="button" className="btn btn--outline" onClick={atras}>
                      Atrás
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn--primary"
                    onClick={continuar}
                    disabled={enviando}
                  >
                    {enviando ? 'Agendando…' : step === 4 ? 'Confirmar mi cita' : 'Continuar'}
                  </button>
                </div>
              </div>

              <aside className="wizard__aside">
                <div className="aside__title">Resumen de tu cita</div>
                <div className="aside__row">
                  <span>Servicio</span>
                  <b>{servicio?.nombre || '—'}</b>
                </div>
                <div className="aside__row">
                  <span>Precio</span>
                  <span className="val">{servicio ? formatCurrency(servicio.precio) : '—'}</span>
                </div>
                <div className="aside__row">
                  <span>Duración</span>
                  <span className="val">{servicio ? `${servicio.duracionMinutos} min` : '—'}</span>
                </div>
                <div className="aside__row">
                  <span>Fecha</span>
                  <span className="val">{fecha ? formatFecha(fecha) : '—'}</span>
                </div>
                <div className="aside__row">
                  <span>Hora</span>
                  <span className="val">{hora || '—'}</span>
                </div>
                <div className="aside__row">
                  <span>Barbero</span>
                  <span className="val">{config.nombreBarbero}</span>
                </div>
              </aside>
            </div>
          </div>
        </section>
      </main>
      <Footer config={config} />
    </>
  )
}

function formatFecha(iso) {
  const valor = iso.includes('T') ? iso : `${iso}T00:00:00`
  const d = new Date(valor)
  return `${ES_DAYS[d.getDay()]} ${d.getDate()} ${ES_MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

function horaHora(isoDatetime) {
  return isoDatetime.substring(11, 16)
}