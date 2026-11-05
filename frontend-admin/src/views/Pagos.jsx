import { useEffect, useState, useCallback } from 'react'
import Sidebar from '../components/Sidebar.jsx'
import Toast from '../components/Toast.jsx'
import { MetodoIcono, nombreMetodo, useMetodosPago } from '../components/MetodoPago.jsx'
import { getResumenPagos, getPagos } from '../services/api.js'
import { subscribeCitas } from '../services/websocket.js'
import { formatMoneyLargo, formatFechaHora } from '../services/format.js'

export default function Pagos() {
  const [resumen, setResumen] = useState(null)
  const [pagos, setPagos] = useState([])
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [metodo, setMetodo] = useState('')
  const [cargando, setCargando] = useState(true)
  const [toast, setToast] = useState(null)
  const metodos = useMetodosPago()

  const cargar = useCallback(async () => {
    const params = {}
    if (desde) params.desde = desde
    if (hasta) params.hasta = hasta
    if (metodo) params.metodo = metodo
    try {
      const [res, lista] = await Promise.all([getResumenPagos(), getPagos(params)])
      setResumen(res)
      setPagos(lista)
    } catch {
      setToast({ message: 'No se pudieron cargar los pagos', tipo: 'error' })
    } finally {
      setCargando(false)
    }
  }, [desde, hasta, metodo])

  useEffect(() => {
    setCargando(true)
    cargar()
  }, [cargar])

  // Un adelanto o cobro hecho en otra pantalla actualiza las ganancias al instante.
  useEffect(() => subscribeCitas(() => cargar()), [cargar])

  const stats = [
    { label: 'Total cobrado', valor: resumen?.total ?? 0, resaltar: true },
    { label: 'Hoy', valor: resumen?.totalHoy ?? 0 },
    { label: 'Esta semana', valor: resumen?.totalSemana ?? 0 },
    { label: 'Este mes', valor: resumen?.totalMes ?? 0 }
  ]

  return (
    <div className="admin">
      <Sidebar />
      <main className="main">
        <div className="container">
          <header className="page-head">
            <div>
              <h1>
                Módulo de <span>pagos</span>
              </h1>
              <div className="page-head__sub">
                Adelantos y cobros de saldo, cada uno con su fecha y método.
              </div>
            </div>
          </header>

          <section className="stats stats--pagos">
            {stats.map((s) => (
              <div className={'stat' + (s.resaltar ? ' stat--money' : '')} key={s.label}>
                <div className="stat__num">{formatMoneyLargo(s.valor)}</div>
                <div className="stat__label">{s.label}</div>
              </div>
            ))}
          </section>

          {resumen && resumen.desglose?.length > 0 && (
            <section className="card">
              <div className="card__title">Por método · {resumen.cantidad} ingreso(s)</div>
              <div className="metodos">
                {resumen.desglose.map((d) => (
                  <div className="metodo" key={d.metodoPago}>
                    <MetodoIcono metodo={d.metodoPago} tamano={40} />
                    <div className="metodo__info">
                      <div className="metodo__name">{nombreMetodo(d.metodoPago)}</div>
                      <span className="metodo__count">{d.cantidad} pago(s)</span>
                    </div>
                    <div className="metodo__total">{formatMoneyLargo(d.total)}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

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
              <label>Método</label>
              <select value={metodo} onChange={(e) => setMetodo(e.target.value)}>
                <option value="">Todos</option>
                {metodos.map((m) => (
                  <option key={m} value={m}>
                    {nombreMetodo(m)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="card">
            <div className="card__title">Historial de ingresos</div>
            {cargando ? (
              <div className="spinner" />
            ) : pagos.length === 0 ? (
              <div className="empty">Aún no hay pagos con esos filtros</div>
            ) : (
              <div className="ingresos">
                {pagos.map((p) => (
                  <div className="ingreso" key={p.id}>
                    <MetodoIcono metodo={p.metodoPago} tamano={42} />
                    <div className="ingreso__info">
                      <strong>{p.nombreCliente}</strong>
                      <span>
                        {p.concepto === 'ADELANTO' ? 'Adelanto' : 'Saldo'} · {p.nombreServicio}
                      </span>
                      <span className="ingreso__fecha">
                        {formatFechaHora(p.fechaPago)} · {nombreMetodo(p.metodoPago)}
                      </span>
                    </div>
                    <div className="ingreso__monto">{formatMoneyLargo(p.montoPagado)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Toast message={toast?.message} tipo={toast?.tipo} onClose={() => setToast(null)} />
    </div>
  )
}
