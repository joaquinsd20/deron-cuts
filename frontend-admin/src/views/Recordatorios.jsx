import { useEffect, useState, useCallback, useRef } from 'react'
import Sidebar from '../components/Sidebar.jsx'
import Toast from '../components/Toast.jsx'
import {
  getRecordatorios,
  crearRecordatorio,
  enviarRecordatorio,
  cancelarRecordatorio,
  eliminarRecordatorio
} from '../services/api.js'
import { subscribeRecordatorios } from '../services/websocket.js'
import { formatFechaHora, formatFechaHoraLarga } from '../services/format.js'

const FILTROS = [
  ['', 'Todos'],
  ['PENDIENTE', 'Pendientes'],
  ['ENVIADO', 'Enviados'],
  ['CANCELADO', 'Cancelados']
]

const TIPOS = {
  NUEVA_CITA: 'Nueva cita',
  REPROGRAMADA: 'Reprogramada',
  CANCELADA: 'Cancelada',
  ANTES_CITA: 'Antes de la cita',
  MANUAL: 'Manual'
}

const ESTADOS = {
  PENDIENTE: 'Pendiente',
  ENVIADO: 'Enviado',
  CANCELADO: 'Cancelado'
}

const FORM = {
  mensaje: '',
  destinatarioNombre: '',
  destinatarioTelefono: '',
  programadoPara: '',
  canal: 'INTERNO'
}

export default function Recordatorios() {
  const [lista, setLista] = useState([])
  const [filtro, setFiltro] = useState('')
  const [cargando, setCargando] = useState(true)
  const [toast, setToast] = useState(null)
  const [formAbierto, setFormAbierto] = useState(false)
  const [form, setForm] = useState(FORM)
  const [guardando, setGuardando] = useState(false)
  const filtroRef = useRef('')

  const cargar = useCallback(async (estado) => {
    const data = await getRecordatorios(estado ? { estado } : {})
    setLista(data)
  }, [])

  const cambiarFiltro = (estado) => {
    filtroRef.current = estado
    setFiltro(estado)
    cargar(estado).catch(() => {})
  }

  useEffect(() => {
    cargar()
      .catch(() => setToast({ message: 'No se pudieron cargar los recordatorios', tipo: 'error' }))
      .finally(() => setCargando(false))

    const unsub = subscribeRecordatorios(() => {
      cargar(filtroRef.current).catch(() => {})
    })
    return unsub
  }, [cargar])

  const setCampo = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }))

  const enviarNuevo = async (e) => {
    e.preventDefault()
    if (!form.mensaje.trim()) return
    setGuardando(true)
    try {
      await crearRecordatorio({
        mensaje: form.mensaje.trim(),
        destinatarioNombre: form.destinatarioNombre.trim() || null,
        destinatarioTelefono: form.destinatarioTelefono.trim() || null,
        programadoPara: form.programadoPara || null,
        canal: form.canal
      })
      setForm(FORM)
      setFormAbierto(false)
      await cargar(filtroRef.current)
      setToast({ message: 'Recordatorio creado' })
    } catch {
      setToast({ message: 'No se pudo crear el recordatorio', tipo: 'error' })
    } finally {
      setGuardando(false)
    }
  }

  const entregar = async (id) => {
    try {
      await enviarRecordatorio(id)
      await cargar(filtroRef.current)
      setToast({ message: 'Recordatorio entregado' })
    } catch {
      setToast({ message: 'No se pudo entregar el recordatorio', tipo: 'error' })
    }
  }

  const cancelar = async (id) => {
    try {
      await cancelarRecordatorio(id)
      await cargar(filtroRef.current)
      setToast({ message: 'Recordatorio cancelado' })
    } catch {
      setToast({ message: 'No se pudo cancelar el recordatorio', tipo: 'error' })
    }
  }

  const borrar = async (id) => {
    if (!window.confirm('¿Eliminar este recordatorio?')) return
    try {
      await eliminarRecordatorio(id)
      await cargar(filtroRef.current)
      setToast({ message: 'Recordatorio eliminado' })
    } catch {
      setToast({ message: 'No se pudo eliminar el recordatorio', tipo: 'error' })
    }
  }

  if (cargando) {
    return (
      <div className="admin">
        <Sidebar />
        <main className="main">
          <div className="spinner" />
        </main>
      </div>
    )
  }

  const pendientes = lista.filter((r) => r.estado === 'PENDIENTE').length
  const esWhatsapp = form.canal === 'WHATSAPP'

  return (
    <div className="admin">
      <Sidebar />
      <main className="main">
        <div className="container">
          <header className="page-head">
            <div>
              <h1>
                Recordatorios y <span>notificaciones</span>
              </h1>
              <div className="page-head__sub">
                {pendientes > 0
                  ? `${pendientes} pendiente${pendientes === 1 ? '' : 's'} por emitir`
                  : 'Al día: sin pendientes'}
              </div>
            </div>
            <button
              className="btn btn--primary"
              onClick={() => setFormAbierto((v) => !v)}
            >
              {formAbierto ? 'Cerrar' : 'Nuevo recordatorio'}
            </button>
          </header>

          {formAbierto && (
            <section className="card">
              <div className="card__title">Crear recordatorio</div>
              <form className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }} onSubmit={enviarNuevo}>
                <div className="field" style={{ gridColumn: '1 / -1' }}>
                  <label>Mensaje</label>
                  <textarea
                    rows={2}
                    value={form.mensaje}
                    onChange={(e) => setCampo('mensaje', e.target.value)}
                    placeholder="Ej: Buenas tardes, recordatorio de tu cita…"
                  />
                </div>
                <div className="field">
                  <label>Destinatario (nombre)</label>
                  <input
                    value={form.destinatarioNombre}
                    onChange={(e) => setCampo('destinatarioNombre', e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Destinatario (WhatsApp)</label>
                  <input
                    value={form.destinatarioTelefono}
                    onChange={(e) => setCampo('destinatarioTelefono', e.target.value)}
                    placeholder="+51 999 999 999"
                  />
                </div>
                <div className="field">
                  <label>Canal</label>
                  <select value={form.canal} onChange={(e) => setCampo('canal', e.target.value)}>
                    <option value="INTERNO">Panel (aviso interno)</option>
                    <option value="WHATSAPP">WhatsApp</option>
                  </select>
                </div>
                <div className="field">
                  <label>Emitir (dejar vacío = ahora)</label>
                  <input
                    type="datetime-local"
                    value={form.programadoPara}
                    onChange={(e) => setCampo('programadoPara', e.target.value)}
                  />
                </div>
                <div className="form-actions" style={{ gridColumn: '1 / -1' }}>
                  <button type="submit" className="btn btn--primary" disabled={guardando}>
                    {guardando ? 'Creando…' : 'Crear recordatorio'}
                  </button>
                </div>
              </form>
              {esWhatsapp && (
                <div className="hint">
                  Al ser por WhatsApp, el recordatorio queda en cola hasta conectar la
                  integración (Meta WhatsApp). Mientras tanto se registra como pendiente.
                </div>
              )}
            </section>
          )}

          <div className="chips">
            {FILTROS.map(([valor, nombre]) => (
              <button
                key={valor || 'todos'}
                className={'chip' + (filtro === valor ? ' chip--active' : '')}
                onClick={() => cambiarFiltro(valor)}
              >
                {nombre}
              </button>
            ))}
          </div>

          <section className="card">
            {lista.length === 0 ? (
              <div className="empty">Sin recordatorios en esta vista.</div>
            ) : (
              <div className="recordatorios__list">
                {lista.map((r) => (
                  <div className="record-card" key={r.id}>
                    <div className="record-card__head">
                      <span className={`badge badge--tipo`}>{TIPOS[r.tipo] || r.tipo}</span>
                      <span className={`badge badge--c${r.canal === 'WHATSAPP' ? 'wa' : 'in'}`}>
                        {r.canal === 'WHATSAPP' ? 'WhatsApp' : 'Panel'}
                      </span>
                      <span className={`badge badge--e${r.estado === 'PENDIENTE' ? 'p' : r.estado === 'ENVIADO' ? 'o' : 'x'}`}>
                        {ESTADOS[r.estado] || r.estado}
                      </span>
                    </div>
                    <p className="record-card__msg">{r.mensaje}</p>
                    <div className="record-card__meta">
                      {r.destinatarioNombre && <span>Para: {r.destinatarioNombre}</span>}
                      {r.destinatarioTelefono && <span>{r.destinatarioTelefono}</span>}
                      {r.servicioNombre && <span>{r.servicioNombre}</span>}
                      {r.fechaHoraCita && <span>Cita: {formatFechaHora(r.fechaHoraCita)}</span>}
                      <span>
                        {r.estado === 'PENDIENTE'
                          ? `Programado: ${formatFechaHoraLarga(r.programadoPara)}`
                          : r.estado === 'ENVIADO'
                            ? `Emitido: ${formatFechaHora(r.enviadoEn || r.programadoPara)}`
                            : 'Cancelado'}
                      </span>
                    </div>
                    <div className="record-card__actions">
                      {r.canal === 'WHATSAPP' && r.estado === 'PENDIENTE' && (
                        <span className="hint">En cola hasta conectar la integración WhatsApp</span>
                      )}
                      {r.estado === 'PENDIENTE' && r.canal === 'INTERNO' && (
                        <button className="btn btn--sm" onClick={() => entregar(r.id)}>
                          Entregar ya
                        </button>
                      )}
                      {r.estado === 'PENDIENTE' && (
                        <button className="btn btn--sm btn--outline" onClick={() => cancelar(r.id)}>
                          Cancelar
                        </button>
                      )}
                      <button className="btn btn--sm btn--danger" onClick={() => borrar(r.id)}>
                        Borrar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
      <Toast message={toast?.message} tipo={toast?.tipo} onClose={() => setToast(null)} />
    </div>
  )
}