import { useEffect, useState, useCallback, useMemo } from 'react'
import Sidebar from '../components/Sidebar.jsx'
import Toast from '../components/Toast.jsx'
import AppointmentCard from '../components/AppointmentCard.jsx'
import { getCitas, cambiarEstadoCita } from '../services/api.js'
import { fechaLocal } from '../services/format.js'

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]
const DOW = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa']

export default function Calendario() {
  const hoy = new Date()
  const [cursor, setCursor] = useState(() => new Date(hoy.getFullYear(), hoy.getMonth(), 1))
  const [seleccion, setSeleccion] = useState(() => fechaLocal(hoy))
  const [citas, setCitas] = useState([])
  const [citasDia, setCitasDia] = useState([])
  const [cargando, setCargando] = useState(true)
  const [toast, setToast] = useState(null)

  const diaSel = new Date(seleccion + 'T00:00:00')

  useEffect(() => {
    const desde = fechaLocal(cursor)
    const hasta = fechaLocal(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0))
    getCitas({ desde, hasta })
      .then(setCitas)
      .catch(() => setToast({ message: 'No se pudieron cargar las citas', tipo: 'error' }))
      .finally(() => setCargando(false))
  }, [cursor])

  useEffect(() => {
    getCitas({ fecha: seleccion })
      .then(setCitasDia)
      .catch(() => {})
  }, [seleccion])

  const porDia = useMemo(() => {
    const mapa = {}
    citas.forEach((c) => {
      const clave = fechaLocal(new Date(c.fechaHoraInicio))
      mapa[clave] = (mapa[clave] || 0) + 1
    })
    return mapa
  }, [citas])

  const celdas = useMemo(() => {
    const primero = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
    const offset = (primero.getDay() + 6) % 7
    const inicio = new Date(cursor.getFullYear(), cursor.getMonth(), 1 - offset)
    const lista = []
    for (let i = 0; i < 42; i++) {
      const d = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + i)
      const clave = fechaLocal(d)
      lista.push({
        clave,
        dia: d.getDate(),
        enMes: d.getMonth() === cursor.getMonth(),
        hoy: clave === fechaLocal(hoy),
        seleccionado: clave === seleccion,
        count: porDia[clave] || 0
      })
    }
    return lista
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor, porDia, seleccion])

  const cambiarEstado = async (id, estado) => {
    try {
      await cambiarEstadoCita(id, estado)
      const desde = fechaLocal(cursor)
      const hasta = fechaLocal(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0))
      setCitas(await getCitas({ desde, hasta }))
      setCitasDia(await getCitas({ fecha: seleccion }))
    } catch {
      setToast({ message: 'No se pudo actualizar la cita', tipo: 'error' })
    }
  }

  const moverMes = (delta) => {
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1))
  }

  return (
    <div className="admin">
      <Sidebar />
      <main className="main">
        <div className="container">
          <header className="page-head">
            <div>
              <h1>
                Calendario de <span>citas</span>
              </h1>
            </div>
            <div className="cal-meta">
              <button className="btn btn--outline btn--sm" onClick={() => moverMes(-1)}>
                ← Anterior
              </button>
              <div className="cal-month">
                {MESES[cursor.getMonth()]} {cursor.getFullYear()}
              </div>
              <button className="btn btn--outline btn--sm" onClick={() => moverMes(1)}>
                Siguiente →
              </button>
            </div>
          </header>

          {cargando ? (
            <div className="spinner" />
          ) : (
            <>
              <div className="cal-grid">
                {DOW.map((d) => (
                  <div className="cal-dow" key={d}>
                    {d}
                  </div>
                ))}
                {celdas.map((c) => (
                  <button
                    key={c.clave}
                    className={
                      'cal-cell' +
                      (c.enMes ? '' : ' cal-cell--other') +
                      (c.hoy ? ' cal-cell--today' : '') +
                      (c.seleccionado ? ' cal-cell--selected' : '')
                    }
                    onClick={() => setSeleccion(c.clave)}
                  >
                    <div className="cal-cell__num">{c.dia}</div>
                    {c.count > 0 && <div className="cal-cell__count">{c.count} cita{c.count > 1 ? 's' : ''}</div>}
                  </button>
                ))}
              </div>

              <h2 className="cal-day-title">
                {diaSel.toLocaleDateString('es-MX', { weekday: 'long', day: '2-digit', month: 'long' })}
              </h2>
              {citasDia.length === 0 ? (
                <div className="empty">Sin citas este día</div>
              ) : (
                citasDia
                  .slice()
                  .sort((a, b) => a.fechaHoraInicio.localeCompare(b.fechaHoraInicio))
                  .map((c) => <AppointmentCard key={c.id} cita={c} onEstado={cambiarEstado} />)
              )}
            </>
          )}
        </div>
      </main>
      <Toast message={toast?.message} tipo={toast?.tipo} onClose={() => setToast(null)} />
    </div>
  )
}