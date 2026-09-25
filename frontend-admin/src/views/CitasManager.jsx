import { useEffect, useState, useCallback } from 'react'
import Sidebar from '../components/Sidebar.jsx'
import Toast from '../components/Toast.jsx'
import AppointmentCard from '../components/AppointmentCard.jsx'
import { getCitas, cambiarEstadoCita, reprogramarCita, registrarPagoCita } from '../services/api.js'
import { fechaLocal, aInputLocal, formatMoney, METODOS_PAGO } from '../services/format.js'

const ESTADOS = [
  { value: '', label: 'Todos los estados' },
  { value: 'PENDIENTE', label: 'Pendientes' },
  { value: 'CONFIRMADA', label: 'Confirmadas' },
  { value: 'COMPLETADA', label: 'Completadas' },
  { value: 'CANCELADA', label: 'Canceladas' }
]

export default function CitasManager() {
  const [desde, setDesde] = useState(fechaLocal())
  const [hasta, setHasta] = useState('')
  const [estado, setEstado] = useState('')
  const [citas, setCitas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [reprogramando, setReprogramando] = useState(null)
  const [nuevaFecha, setNuevaFecha] = useState('')
  const [cobrando, setCobrando] = useState(null)
  const [metodoPago, setMetodoPago] = useState('EFECTIVO')
  const [montoPago, setMontoPago] = useState('')
  const [toast, setToast] = useState(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    const params = {}
    if (desde) params.desde = desde
    if (hasta) params.hasta = hasta
    if (estado) params.estado = estado
    try {
      setCitas(await getCitas(params))
    } catch {
      setToast({ message: 'No se pudieron cargar las citas', tipo: 'error' })
    } finally {
      setCargando(false)
    }
  }, [desde, hasta, estado])

  useEffect(() => {
    cargar()
  }, [cargar])

  const cambiarEstado = async (id, nuevo) => {
    try {
      await cambiarEstadoCita(id, nuevo)
      await cargar()
    } catch {
      setToast({ message: 'No se pudo actualizar la cita', tipo: 'error' })
    }
  }

  const abrirReprogramar = (cita) => {
    setReprogramando(cita)
    setNuevaFecha(aInputLocal(cita.fechaHoraInicio))
  }

  const guardarReprogramacion = async () => {
    if (!nuevaFecha || !reprogramando) return
    try {
      await reprogramarCita(reprogramando.id, nuevaFecha)
      setReprogramando(null)
      setToast({ message: 'Cita reprogramada' })
      await cargar()
    } catch {
      setToast({ message: 'No se pudo reprogramar la cita', tipo: 'error' })
    }
  }

  const abrirCobro = (cita) => {
    setCobrando(cita)
    setMetodoPago('EFECTIVO')
    setMontoPago(String(cita.precioServicio ?? ''))
  }

  const confirmarCobro = async () => {
    if (!cobrando) return
    const payload = { metodoPago }
    const montoNum = Number(montoPago)
    if (montoPago && (Number.isNaN(montoNum) || montoNum <= 0)) {
      setToast({ message: 'Monto inválido', tipo: 'error' })
      return
    }
    if (montoPago) payload.monto = montoNum
    try {
      await registrarPagoCita(cobrando.id, payload)
      setCobrando(null)
      setToast({ message: `Pago de ${formatMoney(payload.monto ?? cobrando.precioServicio)} registrado` })
      await cargar()
    } catch {
      setToast({ message: 'No se pudo registrar el pago', tipo: 'error' })
    }
  }

  return (
    <div className="admin">
      <Sidebar />
      <main className="main">
        <div className="container">
          <header className="page-head">
            <div>
              <h1>
                Gestión de <span>citas</span>
              </h1>
            </div>
          </header>

          <div className="filters card">
            <div className="field">
              <label>Desde</label>
              <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
            </div>
            <div className="field">
              <label>Hasta</label>
              <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
            </div>
            <div className="field">
              <label>Estado</label>
              <select value={estado} onChange={(e) => setEstado(e.target.value)}>
                {ESTADOS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {reprogramando && (
            <div className="card">
              <div className="card__title">
                Reprogramar · {reprogramando.nombreCliente} / {reprogramando.nombreServicio}
              </div>
              <div className="form-grid">
                <div className="field">
                  <label>
                    Nueva fecha y hora <span className="req">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={nuevaFecha}
                    onChange={(e) => setNuevaFecha(e.target.value)}
                  />
                </div>
                <div className="cita__actions">
                  <button className="btn btn--primary btn--sm" onClick={guardarReprogramacion}>
                    Guardar
                  </button>
                  <button className="btn btn--outline btn--sm" onClick={() => setReprogramando(null)}>
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          {cobrando && (
            <div className="card">
              <div className="card__title">
                Cobrar · {cobrando.nombreCliente} / {cobrando.nombreServicio}{' '}
                ({formatMoney(cobrando.precioServicio)})
              </div>
              <div className="form-grid">
                <div className="field">
                  <label>
                    Método de pago <span className="req">*</span>
                  </label>
                  <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
                    {METODOS_PAGO.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Monto (deja vacío para el precio del servicio)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={montoPago}
                    onChange={(e) => setMontoPago(e.target.value)}
                  />
                </div>
                <div className="cita__actions">
                  <button className="btn btn--pago btn--sm" onClick={confirmarCobro}>
                    Registrar pago
                  </button>
                  <button className="btn btn--outline btn--sm" onClick={() => setCobrando(null)}>
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          <div style={{ marginTop: 18 }}>
            {cargando ? (
              <div className="spinner" />
            ) : citas.length === 0 ? (
              <div className="empty">No hay citas con esos filtros</div>
            ) : (
              citas
                .slice()
                .sort((a, b) => a.fechaHoraInicio.localeCompare(b.fechaHoraInicio))
                .map((c) => (
                  <AppointmentCard
                    key={c.id}
                    cita={c}
                    onEstado={cambiarEstado}
                    onReprogramar={abrirReprogramar}
                    onRegistrarPago={abrirCobro}
                  />
                ))
            )}
          </div>
        </div>
      </main>
      <Toast message={toast?.message} tipo={toast?.tipo} onClose={() => setToast(null)} />
    </div>
  )
}