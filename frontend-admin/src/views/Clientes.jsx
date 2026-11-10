import { useEffect, useMemo, useState } from 'react'
import Sidebar from '../components/Sidebar.jsx'
import Toast from '../components/Toast.jsx'
import {
  getClientes,
  restablecerPasswordCliente,
  crearClienteExterno,
  actualizarCliente,
  eliminarCliente,
  mensajeError
} from '../services/api.js'
import { formatMoney } from '../services/format.js'

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto',
  'septiembre', 'octubre', 'noviembre', 'diciembre']

function fechaCorta(iso) {
  if (!iso) return '—'
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number)
  return `${d} de ${MESES[m - 1]}${y ? ` ${y}` : ''}`
}

function diaMes(iso) {
  const [, m, d] = String(iso).slice(0, 10).split('-').map(Number)
  return `${d} de ${MESES[m - 1]}`
}

function textoCumple(c) {
  if (!c.fechaNacimiento) return null
  if (c.diasParaCumple === 0) return `¡Hoy cumple ${c.edadQueCumple}! 🎉`
  if (c.diasParaCumple === 1) return `Mañana cumple ${c.edadQueCumple}`
  if (c.diasParaCumple <= 7) return `Cumple ${c.edadQueCumple} en ${c.diasParaCumple} días`
  return `Faltan ${c.diasParaCumple} días`
}

function textoFrecuencia(c) {
  if (c.frecuenciaDias) {
    if (c.frecuenciaDias <= 9) return `Viene cada ~${c.frecuenciaDias} días`
    const semanas = Math.round(c.frecuenciaDias / 7)
    return `Viene cada ~${semanas} semana${semanas === 1 ? '' : 's'}`
  }
  if (c.visitas === 1) return 'Ha venido 1 vez'
  return 'Aún sin visitas completadas'
}

function linkWhatsapp(telefono, texto) {
  let numero = String(telefono || '').replace(/\D/g, '')
  if (!numero) return null
  if (numero.length === 9) numero = `51${numero}`
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`
}

const ORDENES = {
  recientes: { label: 'Recientes', fn: (a, b) => b.id - a.id },
  cumple: {
    label: 'Cumpleaños próximos',
    fn: (a, b) => (a.diasParaCumple ?? 999) - (b.diasParaCumple ?? 999)
  },
  visitas: { label: 'Más visitas', fn: (a, b) => b.visitas - a.visitas },
  gasto: { label: 'Más gasto', fn: (a, b) => Number(b.totalGastado) - Number(a.totalGastado) }
}

export default function Clientes() {
  const [q, setQ] = useState('')
  const [orden, setOrden] = useState('recientes')
  const [lista, setLista] = useState([])
  const [cargando, setCargando] = useState(true)
  const [toast, setToast] = useState(null)
  const [temporal, setTemporal] = useState(null) // { cliente, clave }
  const [creando, setCreando] = useState(false)
  const [guardandoNuevo, setGuardandoNuevo] = useState(false)
  const VACIO = { nombre: '', telefono: '', email: '', fechaNacimiento: '' }
  const [nuevo, setNuevo] = useState(VACIO)

  // null = alta de cliente nuevo; si no, el cliente que se está editando.
  const [editando, setEditando] = useState(null)

  const abrirNuevo = () => {
    setEditando(null)
    setNuevo(VACIO)
    setCreando(true)
  }

  const abrirEdicion = (c) => {
    setEditando(c)
    setNuevo({
      nombre: c.nombre || '',
      telefono: c.telefono || '',
      email: c.email || '',
      fechaNacimiento: c.fechaNacimiento ? String(c.fechaNacimiento).slice(0, 10) : ''
    })
    setCreando(true)
  }

  const guardarNuevo = async () => {
    setGuardandoNuevo(true)
    const datos = {
      nombre: nuevo.nombre,
      telefono: nuevo.telefono,
      email: nuevo.email || null,
      fechaNacimiento: nuevo.fechaNacimiento || null
    }
    try {
      if (editando) {
        const c = await actualizarCliente(editando.id, datos)
        setLista((l) => l.map((x) => (x.id === c.id ? c : x)))
        setToast({ message: `Datos de ${c.nombre} actualizados` })
      } else {
        const c = await crearClienteExterno(datos)
        setLista((l) => [c, ...l])
        setToast({ message: `${c.nombre} agregado a tus clientes` })
      }
      setNuevo(VACIO)
      setEditando(null)
      setCreando(false)
    } catch (err) {
      setToast({ message: mensajeError(err, 'No se pudo guardar el cliente'), tipo: 'error' })
    } finally {
      setGuardandoNuevo(false)
    }
  }

  const borrar = async (c) => {
    const ok = window.confirm(
      `¿Eliminar a ${c.nombre}?\n\n` +
        'Se borra su ficha' +
        (c.externo ? '' : ' y ya no podrá entrar a su cuenta en la web') +
        '. Sus citas y pagos se conservan con su nombre, así que tus ganancias no cambian.'
    )
    if (!ok) return
    try {
      await eliminarCliente(c.id)
      setLista((l) => l.filter((x) => x.id !== c.id))
      setToast({ message: `${c.nombre} eliminado` })
    } catch (err) {
      setToast({ message: mensajeError(err, 'No se pudo eliminar el cliente'), tipo: 'error' })
    }
  }

  useEffect(() => {
    const id = window.setTimeout(() => {
      setCargando(true)
      getClientes(q.trim())
        .then(setLista)
        .catch(() => setToast({ message: 'No se pudieron cargar los clientes', tipo: 'error' }))
        .finally(() => setCargando(false))
    }, 300)
    return () => window.clearTimeout(id)
  }, [q])

  const ordenados = useMemo(() => lista.slice().sort(ORDENES[orden].fn), [lista, orden])
  const cumplenPronto = lista.filter((c) => c.diasParaCumple != null && c.diasParaCumple <= 7)

  const restablecer = async (cliente) => {
    const ok = window.confirm(
      `¿Generar una clave temporal para ${cliente.nombre}?\n\nSu contraseña actual dejará de funcionar.`
    )
    if (!ok) return
    try {
      const { passwordTemporal } = await restablecerPasswordCliente(cliente.id)
      setTemporal({ cliente, clave: passwordTemporal })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      setToast({ message: 'No se pudo generar la clave temporal', tipo: 'error' })
    }
  }

  const mensajeClave = temporal
    ? `Hola ${temporal.cliente.nombre}, tu clave temporal de DERON CUTS es: ${temporal.clave}\n` +
      `Entra con tu correo (${temporal.cliente.email}) y cámbiala en "Mi cuenta".`
    : ''

  return (
    <div className="admin">
      <Sidebar />
      <main className="main">
        <div className="container">
          <header className="page-head">
            <div>
              <h1>
                Mis <span>clientes</span>
              </h1>
              <p className="page-head__sub">
                Cumpleaños, cada cuánto vienen y cuánto han gastado. Toca un cliente para escribirle.
              </p>
            </div>
            <button type="button" className="btn btn--primary" onClick={abrirNuevo}>
              + Nuevo cliente
            </button>
          </header>

          {creando && (
            <div className="modal" role="presentation" onClick={() => !guardandoNuevo && setCreando(false)}>
              <div className="modal__panel" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                <div className="card__title">{editando ? `Editar a ${editando.nombre}` : 'Nuevo cliente'}</div>
                <p className="modal__sub">
                  {editando
                    ? editando.externo
                      ? 'Corrige sus datos. Sus citas y pagos siguen vinculados.'
                      : 'Ojo: tiene cuenta web y entra con su correo; si lo cambias, debe usar el nuevo para iniciar sesión.'
                    : 'Para clientes que llegan por WhatsApp o en persona. Si luego se registra en la web con este teléfono, recupera su historial.'}
                </p>
                {[
                  ['nombre', 'Nombre', 'text'],
                  ['telefono', 'Teléfono / WhatsApp', 'tel'],
                  ['email', editando && !editando.externo ? 'Correo' : 'Correo (opcional)', 'email'],
                  ['fechaNacimiento', 'Cumpleaños (opcional)', 'date']
                ].map(([k, label, tipo]) => (
                  <div className="field" key={k}>
                    <label htmlFor={`nc-${k}`}>{label}</label>
                    <input
                      id={`nc-${k}`}
                      type={tipo}
                      inputMode={tipo === 'tel' ? 'tel' : undefined}
                      value={nuevo[k]}
                      onChange={(e) => setNuevo({ ...nuevo, [k]: e.target.value })}
                    />
                  </div>
                ))}
                <div className="modal__acciones">
                  <button type="button" className="btn btn--primary" onClick={guardarNuevo} disabled={guardandoNuevo}>
                    {guardandoNuevo ? 'Guardando…' : editando ? 'Guardar cambios' : 'Guardar cliente'}
                  </button>
                  <button type="button" className="btn btn--outline" onClick={() => setCreando(false)}>
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          {cumplenPronto.length > 0 && (
            <div className="card cumple-aviso">
              <div className="card__title">🎂 Cumpleaños esta semana</div>
              <p>
                {cumplenPronto.map((c) => `${c.nombre} (${diaMes(c.proximoCumple)})`).join(' · ')}
              </p>
              <p className="hint">En la semana de su cumpleaños el corte es gratis: ¡avísales!</p>
            </div>
          )}

          <div className="card filters" style={{ marginBottom: 18 }}>
            <div className="field">
              <label htmlFor="buscar-cliente">Buscar</label>
              <input
                id="buscar-cliente"
                placeholder="Nombre, correo o teléfono"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="orden-clientes">Ordenar por</label>
              <select id="orden-clientes" value={orden} onChange={(e) => setOrden(e.target.value)}>
                {Object.entries(ORDENES).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {temporal && (
            <div className="card clave-temporal">
              <div className="card__title">Clave temporal de {temporal.cliente.nombre}</div>
              <div className="clave-temporal__clave">{temporal.clave}</div>
              <p className="hint">Solo se muestra ahora. Envíasela y pídele que la cambie al entrar.</p>
              <div className="cita__actions">
                {linkWhatsapp(temporal.cliente.telefono, mensajeClave) && (
                  <a
                    className="btn btn--primary btn--whatsapp"
                    href={linkWhatsapp(temporal.cliente.telefono, mensajeClave)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Enviar por WhatsApp
                  </a>
                )}
                <button
                  type="button"
                  className="btn btn--outline"
                  onClick={() => {
                    navigator.clipboard?.writeText(temporal.clave)
                    setToast({ message: 'Clave copiada' })
                  }}
                >
                  Copiar
                </button>
                <button type="button" className="btn btn--outline" onClick={() => setTemporal(null)}>
                  Listo
                </button>
              </div>
            </div>
          )}

          {cargando ? (
            <div className="spinner" />
          ) : ordenados.length === 0 ? (
            <div className="empty">{q ? 'Ningún cliente coincide' : 'Aún no hay clientes registrados'}</div>
          ) : (
            <div className="fichas">
              {ordenados.map((c) => {
                const wsp = linkWhatsapp(c.telefono, `Hola ${c.nombre}, te escribe Yumpi de DERON CUTS.`)
                const cumpleCerca = c.diasParaCumple != null && c.diasParaCumple <= 7
                return (
                  <article className={`ficha${cumpleCerca ? ' ficha--cumple' : ''}`} key={c.id}>
                    <header className="ficha__head">
                      <div className="ficha__avatar" aria-hidden="true">
                        {(c.nombre || '?').trim().charAt(0).toUpperCase()}
                      </div>
                      <div className="ficha__titulo">
                        <strong>
                          {c.nombre} {c.externo && <span className="etiqueta-externo">Externo</span>}
                        </strong>
                        <span>{c.email || 'Sin correo'}</span>
                        <span>{c.telefono || 'Sin teléfono'}</span>
                      </div>
                    </header>

                    <div className="ficha__datos">
                      <div className="dato">
                        <span className="dato__k">🎂 Cumpleaños</span>
                        <span className="dato__v">
                          {c.fechaNacimiento ? diaMes(c.fechaNacimiento) : 'No registrado'}
                        </span>
                        {textoCumple(c) && <span className="dato__s">{textoCumple(c)}</span>}
                      </div>
                      <div className="dato">
                        <span className="dato__k">🔁 Frecuencia</span>
                        <span className="dato__v">{textoFrecuencia(c)}</span>
                        <span className="dato__s">
                          {c.visitas} visita{c.visitas === 1 ? '' : 's'} · {c.canceladas} cancelada
                          {c.canceladas === 1 ? '' : 's'}
                        </span>
                      </div>
                      <div className="dato">
                        <span className="dato__k">✂️ Última visita</span>
                        <span className="dato__v">{c.ultimaVisita ? fechaCorta(c.ultimaVisita) : '—'}</span>
                        {c.diasSinVenir != null && (
                          <span className="dato__s">
                            {c.diasSinVenir <= 0 ? 'Hoy' : c.diasSinVenir === 1 ? 'Ayer' : `Hace ${c.diasSinVenir} días`}
                          </span>
                        )}
                      </div>
                      <div className="dato">
                        <span className="dato__k">📅 Próxima cita</span>
                        <span className="dato__v">
                          {c.proximaCita
                            ? `${fechaCorta(c.proximaCita)} · ${String(c.proximaCita).slice(11, 16)}`
                            : 'Sin reservar'}
                        </span>
                      </div>
                      <div className="dato">
                        <span className="dato__k">💰 Ha gastado</span>
                        <span className="dato__v">{formatMoney(c.totalGastado)}</span>
                      </div>
                      <div className="dato">
                        <span className="dato__k">⭐ Corte favorito</span>
                        <span className="dato__v">{c.servicioFavorito || '—'}</span>
                      </div>
                    </div>

                    <div className="ficha__acciones">
                      {wsp && (
                        <a className="btn btn--sm btn--whatsapp" href={wsp} target="_blank" rel="noreferrer">
                          WhatsApp
                        </a>
                      )}
                      {c.email && (
                        <button className="btn btn--sm btn--outline" onClick={() => restablecer(c)}>
                          Clave temporal
                        </button>
                      )}
                      <button className="btn btn--sm btn--outline" onClick={() => abrirEdicion(c)}>
                        Editar
                      </button>
                      <button className="btn btn--sm btn--danger" onClick={() => borrar(c)}>
                        Eliminar
                      </button>
                      <span className="ficha__desde">
                        Cliente desde {c.registradoEn ? fechaCorta(c.registradoEn) : '—'} ·{' '}
                        {c.externo
                          ? 'agregado por ti (sin cuenta web)'
                          : [c.tienePassword && 'contraseña', c.googleVinculado && 'Google'].filter(Boolean).join(' + ') ||
                            'sin acceso'}
                      </span>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </main>
      <Toast message={toast?.message} tipo={toast?.tipo} onClose={() => setToast(null)} />
    </div>
  )
}
