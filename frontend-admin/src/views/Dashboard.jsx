import { useEffect, useState, useCallback, useRef } from 'react'
import Sidebar from '../components/Sidebar.jsx'
import Toast from '../components/Toast.jsx'
import Reloj from '../components/Reloj.jsx'
import AppointmentCard from '../components/AppointmentCard.jsx'
import { getResumen, getCitas, cambiarEstadoCita } from '../services/api.js'
import { subscribeCitas, subscribeRecordatorios } from '../services/websocket.js'
import { fechaLocal, formatFechaHora, formatMoney } from '../services/format.js'

function useCountUp(target, duracion = 700) {
  const [valor, setValor] = useState(0)
  const previo = useRef(0)

  useEffect(() => {
    const desde = previo.current
    const hasta = Number(target) || 0
    previo.current = hasta
    if (desde === hasta) {
      setValor(hasta)
      return
    }
    const inicio = performance.now()
    let raf
    const paso = (t) => {
      const p = Math.min(1, (t - inicio) / duracion)
      const eased = 1 - Math.pow(1 - p, 3)
      setValor(desde + (hasta - desde) * eased)
      if (p < 1) raf = requestAnimationFrame(paso)
    }
    raf = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(raf)
  }, [target, duracion])

  return valor
}

function StatCard({ label, valor, warn, money }) {
  const animado = useCountUp(valor)
  const texto = money ? formatMoney(animado) : Math.round(animado).toLocaleString('es-PE')
  return (
    <div className={'stat' + (money ? ' stat--money' : '')}>
      <div className={'stat__num' + (warn ? ' stat__num--warn' : '')}>{texto}</div>
      <div className="stat__label">{label}</div>
    </div>
  )
}

function sonidoNuevaCita() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12)
    gain.gain.setValueAtTime(0.0001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35)
    osc.start()
    osc.stop(ctx.currentTime + 0.4)
    osc.onended = () => ctx.close()
  } catch {
    return
  }
}

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

    const unsubs = [
      subscribeCitas(() => {
        cargar().catch(() => {})
      }),
      subscribeRecordatorios((rec) => {
        if (rec.tipo === 'NUEVA_CITA') {
          sonidoNuevaCita()
          setToast({ message: `Nueva cita: ${rec.destinatarioNombre || 'cliente registrado'}` })
        } else if (rec.mensaje) {
          sonidoNuevaCita()
          setToast({ message: rec.mensaje })
        }
        cargar().catch(() => {})
      })
    ]
    return () => unsubs.forEach((u) => u())
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
    { label: 'Ganancias hoy', valor: resumen?.gananciasHoy ?? 0, money: true }
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
              <Reloj />
            </div>
          </header>

          <section className="stats">
            {stats.map((s) => (
              <StatCard key={s.label} {...s} />
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
      <Toast message={toast?.message} tipo={toast?.tipo} onClose={() => setToast(null)} />
    </div>
  )
}