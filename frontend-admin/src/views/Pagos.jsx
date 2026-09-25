import { useEffect, useState, useCallback } from 'react'
import Sidebar from '../components/Sidebar.jsx'
import Toast from '../components/Toast.jsx'
import { getResumenPagos, getPagos } from '../services/api.js'
import {
  formatMoneyLargo,
  formatFechaHora,
  METODOS_PAGO
} from '../services/format.js'

const METODO_LABEL = {
  EFECTIVO: 'Efectivo',
  YAPE: 'Yape',
  PLIN: 'Plin',
  TARJETA: 'Tarjeta',
  TRANSFERENCIA: 'Transferencia'
}

export default function Pagos() {
  const [resumen, setResumen] = useState(null)
  const [pagos, setPagos] = useState([])
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [metodo, setMetodo] = useState('')
  const [cargando, setCargando] = useState(true)
  const [toast, setToast] = useState(null)

  const cargar = useCallback(async () => {
    setCargando(true)
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
    cargar()
  }, [cargar])

  const stats = [
    { label: 'Total cobrado', valor: resumen?.total ?? 0, resaltar: true },
    { label: 'Hoy', valor: resumen?.totalHoy ?? 0 },
    { label: 'Esta semana', valor: resumen?.totalSemana ?? 0 },
    { label: 'Este mes', valor: resumen?.totalMes ?? 0 },
    { label: 'Pagos registrados', valor: resumen?.cantidad ?? 0 }
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
              <div className="page-head__sub">¿Cuánto estás ganando?</div>
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
              <div className="card__title">Desglose por método</div>
              <div className="metodos">
                {resumen.desglose.map((d) => (
                  <div className="metodo" key={d.metodoPago}>
                    <div className="metodo__name">
                      {METODO_LABEL[d.metodoPago] || d.metodoPago}
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
                {METODOS_PAGO.map((m) => (
                  <option key={m} value={m}>
                    {METODO_LABEL[m] || m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="card">
            <div className="card__title">Historial de pagos</div>
            {cargando ? (
              <div className="spinner" />
            ) : pagos.length === 0 ? (
              <div className="empty">Aún no hay pagos con esos filtros</div>
            ) : (
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Cliente</th>
                    <th>Servicio</th>
                    <th>Método</th>
                    <th className="tabla__num">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {pagos.map((p) => (
                    <tr key={p.id}>
                      <td>{formatFechaHora(p.fechaPago)}</td>
                      <td>{p.nombreCliente}</td>
                      <td>{p.nombreServicio}</td>
                      <td>
                        <span className={`tag tag--metodo ${'tag--' + (p.metodoPago || '').toLowerCase()}`}>
                          {METODO_LABEL[p.metodoPago] || p.metodoPago}
                        </span>
                      </td>
                      <td className="tabla__num">{formatMoneyLargo(p.montoPagado)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
      <Toast message={toast?.message} tipo={toast?.tipo} />
    </div>
  )
}