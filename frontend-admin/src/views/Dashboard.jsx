import { useEffect, useState, useCallback } from 'react'
import Sidebar from '../components/Sidebar.jsx'
import Toast from '../components/Toast.jsx'
import AppointmentCard from '../components/AppointmentCard.jsx'
import { getResumen, getCitas, cambiarEstadoCita } from '../services/api.js'
import { subscribeCitas } from '../services/websocket.js'
import { fechaLocal, formatFechaHora, formatMoney } from '../services/format.js'

export default function Dashboard() {
  const [resumen, setResumen] = useState(null)
  const [citasHoy, setCitasHoy] = useState([])
  const [toast, setToast] = useState(null)
  const [cargando, setCargando] = useState(true)

  const cargar = useCallback(async () => {
    const [res, citas] = await Promise.all([
      getResumen(),
      getCitas({ fecha: fechaLocal() })
    ])
    setResumen(res)
    setCitasHoy(citas)
  }, [])

  useEffect(() => {
    cargar()
      .catch(() => setToast({ message: 'No se pudo cargar el panel', tipo: 'error' }))
      .finally(() => setCargando(false))

    const unsub = subscribeCitas(() => {
      cargar().catch(() => {})
    })
    return unsub
  }, [cargar])

  const cambiarEstado = async (id, estado) => {
    try {
      await cambiarEstadoCita(id, estado)
      await cargar()
    } catch {
      setToast({ message: 'No se pudo actualizar la cita', tipo: 'error' })
    }
  }

  if (cargando && !resumen) {
    return (
      <div className="admin">
        <Sidebar />
        <main className="main">
          <div className="spinner" />
        </main>
      </div>
    )
  }

  const stats = [
    { label: 'Citas hoy', valor: resumen?.citasHoy ?? 0 },
    { label: 'Pendientes', valor: resumen?.pendientes ?? 0, warn: true },
    { label: 'Confirmadas', valor: resumen?.confirmadas ?? 0 },
    { label: 'Completadas', valor: resumen?.completadas ?? 0 },
    { label: 'Canceladas', valor: resumen?.canceladas ?? 0 },
    { label: 'Ganancias hoy', valor: formatMoney(resumen?.gananciasHoy ?? 0), money: true }
  ]

  return (
    <div className="admin">
      <Sidebar />
      <main className="main">
        <div className="container">
          <header className="page-head">
            <div>
              <h1>
                Panel de <span>control</span>
              </h1>
              <div className="page-head__sub">{fechaLocal()}</div>
            </div>
          </header>

          <section className="stats">
            {stats.map((s) => (
              <div className={'stat' + (s.money ? ' stat--money' : '')} key={s.label}>
                <div className={'stat__num' + (s.warn ? ' stat__num--warn' : '')}>{s.valor}</div>
                <div className="stat__label">{s.label}</div>
              </div>
            ))}
          </section>

          {resumen?.proximaCita && (
            <section className="card">
              <div className="card__title">
                Próxima cita · {formatFechaHora(resumen.proximaCita.fechaHoraInicio)}
              </div>
              <AppointmentCard cita={resumen.proximaCita} onEstado={cambiarEstado} />
            </section>
          )}

          <section className="card">
            <div className="card__title">Agenda de hoy</div>
            {citasHoy.length === 0 ? (
              <div className="empty">Sin citas para hoy. Descansa en grande.</div>
            ) : (
              citasHoy
                .slice()
                .sort((a, b) => a.fechaHoraInicio.localeCompare(b.fechaHoraInicio))
                .map((c) => (
                  <AppointmentCard key={c.id} cita={c} onEstado={cambiarEstado} />
                ))
            )}
          </section>
        </div>
      </main>
      <Toast message={toast?.message} tipo={toast?.tipo} />
    </div>
  )
}