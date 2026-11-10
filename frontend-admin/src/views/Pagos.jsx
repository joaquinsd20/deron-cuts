import { useEffect, useState, useCallback, useMemo } from 'react'
import Sidebar from '../components/Sidebar.jsx'
import Toast from '../components/Toast.jsx'
import { MetodoIcono, nombreMetodo, useMetodosPago } from '../components/MetodoPago.jsx'
import {
  getResumenPagos,
  getPagos,
  descargarReporte,
  enviarReporte,
  eliminarPago,
  mensajeError
} from '../services/api.js'
import NuevoIngreso from '../components/NuevoIngreso.jsx'
import EditarPago from '../components/EditarPago.jsx'
import { subscribeCitas } from '../services/websocket.js'
import { formatMoneyLargo, formatFechaHora, fechaLocal } from '../services/format.js'

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

  const [nuevoIngreso, setNuevoIngreso] = useState(false)
  const semanas = useMemo(() => {
    const lunes = new Date()
    lunes.setHours(0, 0, 0, 0)
    lunes.setDate(lunes.getDate() - ((lunes.getDay() + 6) % 7))
    return Array.from({ length: 8 }, (_, i) => {
      const d = new Date(lunes)
      d.setDate(d.getDate() - 7 * i)
      const fin = new Date(d)
      fin.setDate(fin.getDate() + 6)
      const f = (x) => x.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })
      return {
        valor: fechaLocal(d),
        etiqueta: `${i === 0 ? 'Esta semana' : i === 1 ? 'Semana pasada' : 'Semana'} · ${f(d)} – ${f(fin)}`
      }
    })
  }, [])
  const [semanaReporte, setSemanaReporte] = useState(() => semanas[1].valor)
  const [reporteOcupado, setReporteOcupado] = useState(false)

  const bajarReporte = async () => {
    setReporteOcupado(true)
    try {
      await descargarReporte(semanaReporte)
    } catch {
      setToast({ message: 'No se pudo generar el reporte', tipo: 'error' })
    } finally {
      setReporteOcupado(false)
    }
  }

  const mandarReporte = async () => {
    setReporteOcupado(true)
    try {
      const { destino } = await enviarReporte(semanaReporte)
      setToast({ message: `Reporte enviado a ${destino}` })
    } catch (err) {
      setToast({ message: mensajeError(err, 'No se pudo enviar el reporte'), tipo: 'error' })
    } finally {
      setReporteOcupado(false)
    }
  }

  const [editandoPago, setEditandoPago] = useState(null)

  const borrarIngreso = async (p) => {
    const monto = formatMoneyLargo(p.montoPagado)
    const texto =
      p.concepto === 'MANUAL'
        ? `¿Borrar el ingreso "${p.nombreServicio}" de ${monto}?`
        : p.concepto === 'ADELANTO'
          ? `¿Borrar el adelanto de ${monto} de ${p.nombreCliente}?\n\nLa cita quedará con el adelanto sin pagar.`
          : `¿Borrar el cobro de ${monto} de ${p.nombreCliente}?\n\nLa cita volverá a quedar por cobrar.`
    if (!window.confirm(texto)) return
    try {
      await eliminarPago(p.id)
      setToast({ message: 'Pago borrado' })
      cargar()
    } catch (err) {
      setToast({ message: mensajeError(err, 'No se pudo borrar el pago'), tipo: 'error' })
    }
  }

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
                Adelantos, cobros de saldo e ingresos manuales, cada uno con su fecha y método.
              </div>
            </div>
            <button type="button" className="btn btn--primary" onClick={() => setNuevoIngreso(true)}>
              + Registrar ingreso
            </button>
          </header>

          {nuevoIngreso && (
            <NuevoIngreso
              metodos={metodos}
              onCerrar={() => setNuevoIngreso(false)}
              onGuardado={() => cargar()}
              avisar={setToast}
            />
          )}

          {editandoPago && (
            <EditarPago
              pago={editandoPago}
              metodos={metodos}
              onCerrar={() => setEditandoPago(null)}
              onGuardado={() => cargar()}
              avisar={setToast}
            />
          )}

          <section className="card reporte">
            <div className="reporte__texto">
              <div className="card__title">Reporte semanal en PDF</div>
              <p className="page-head__sub">
                Llega solo a tu correo cada lunes a las 8:00. También puedes descargarlo cuando quieras.
              </p>
            </div>
            <div className="reporte__acciones">
              <div className="field">
                <label htmlFor="rep-semana">Semana</label>
                <select id="rep-semana" value={semanaReporte} onChange={(e) => setSemanaReporte(e.target.value)}>
                  {semanas.map((s) => (
                    <option key={s.valor} value={s.valor}>
                      {s.etiqueta}
                    </option>
                  ))}
                </select>
              </div>
              <button type="button" className="btn btn--outline" onClick={bajarReporte} disabled={reporteOcupado}>
                ⬇ Descargar PDF
              </button>
              <button type="button" className="btn btn--outline" onClick={mandarReporte} disabled={reporteOcupado}>
                ✉ Enviar a mi correo
              </button>
            </div>
          </section>

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
                        {p.concepto === 'ADELANTO' ? 'Adelanto' : p.concepto === 'SALDO' ? 'Saldo' : 'Ingreso manual'} ·{' '}
                        {p.nombreServicio}
                      </span>
                      <span className="ingreso__fecha">
                        {formatFechaHora(p.fechaPago)} · {nombreMetodo(p.metodoPago)}
                      </span>
                    </div>
                    <div className="ingreso__monto">{formatMoneyLargo(p.montoPagado)}</div>
                    <div className="ingreso__botones">
                      <button
                        type="button"
                        className="ingreso__borrar ingreso__editar"
                        aria-label="Editar pago"
                        title="Editar"
                        onClick={() => setEditandoPago(p)}
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        className="ingreso__borrar"
                        aria-label="Borrar pago"
                        title="Borrar"
                        onClick={() => borrarIngreso(p)}
                      >
                        ×
                      </button>
                    </div>
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
