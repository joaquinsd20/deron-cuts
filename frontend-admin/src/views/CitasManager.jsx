import { useEffect, useState, useCallback } from 'react'
import Sidebar from '../components/Sidebar.jsx'
import Toast from '../components/Toast.jsx'
import AppointmentCard from '../components/AppointmentCard.jsx'
import { useAccionesCita } from '../components/AccionesCita.jsx'
import { getCitas } from '../services/api.js'
import { subscribeCitas } from '../services/websocket.js'
import { fechaLocal } from '../services/format.js'

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
  const [toast, setToast] = useState(null)

  const cargar = useCallback(async () => {
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
    setCargando(true)
    cargar()
  }, [cargar])

  // Nuevas reservas o cambios hechos desde otro dispositivo aparecen solos.
  useEffect(() => subscribeCitas(() => cargar()), [cargar])

  const { accionesTarjeta, ventana } = useAccionesCita({ alCambiar: cargar, avisar: setToast })

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

          <div style={{ marginTop: 18 }}>
            {cargando ? (
              <div className="spinner" />
            ) : citas.length === 0 ? (
              <div className="empty">No hay citas con esos filtros</div>
            ) : (
              citas
                .slice()
                .sort((a, b) => a.fechaHoraInicio.localeCompare(b.fechaHoraInicio))
                .map((c) => <AppointmentCard key={c.id} cita={c} {...accionesTarjeta} />)
            )}
          </div>
        </div>
      </main>
      {ventana}
      <Toast message={toast?.message} tipo={toast?.tipo} onClose={() => setToast(null)} />
    </div>
  )
}
