import { useEffect, useState } from 'react'
import { getClientes, registrarIngresoManual, mensajeError } from '../services/api.js'
import { MetodoSelector } from './MetodoPago.jsx'

const SUGERENCIAS = ['Corte sin reserva', 'Propina', 'Venta de producto', 'Diseño adicional']

/** Ventana para registrar dinero que no vino de una cita (corte sin reserva, propina, producto…). */
export default function NuevoIngreso({ metodos, onCerrar, onGuardado, avisar }) {
  const [monto, setMonto] = useState('')
  const [metodo, setMetodo] = useState(metodos.includes('EFECTIVO') ? 'EFECTIVO' : metodos[0])
  const [concepto, setConcepto] = useState('')
  const [fecha, setFecha] = useState('')
  const [clientes, setClientes] = useState([])
  const [clienteId, setClienteId] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    getClientes().then(setClientes).catch(() => {})
  }, [])

  const guardar = async () => {
    const n = Number(monto)
    if (!n || n <= 0) return avisar({ message: 'Escribe un monto mayor a cero', tipo: 'error' })
    if (!concepto.trim()) return avisar({ message: 'Escribe el concepto', tipo: 'error' })
    setEnviando(true)
    try {
      await registrarIngresoManual({
        monto: n,
        metodo,
        concepto: concepto.trim(),
        fecha: fecha ? `${fecha}:00` : null,
        clienteId: clienteId ? Number(clienteId) : null
      })
      avisar({ message: `Ingreso de S/ ${n.toFixed(2)} registrado` })
      onGuardado?.()
      onCerrar()
    } catch (err) {
      avisar({ message: mensajeError(err, 'No se pudo registrar el ingreso'), tipo: 'error' })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="modal" role="presentation" onClick={() => !enviando && onCerrar()}>
      <div className="modal__panel" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="card__title">Registrar ingreso</div>
        <p className="modal__sub">Dinero que no vino de una reserva: un corte sin cita, una propina, una venta…</p>

        <div className="field">
          <label htmlFor="ni-monto">Monto (S/)</label>
          <input
            id="ni-monto"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.50"
            autoFocus
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
          />
        </div>

        <div className="field">
          <label>¿Cómo te pagaron?</label>
          <MetodoSelector valor={metodo} onChange={setMetodo} metodos={metodos} />
        </div>

        <div className="field">
          <label htmlFor="ni-concepto">Concepto</label>
          <input
            id="ni-concepto"
            maxLength={120}
            placeholder="Ej.: Corte sin reserva"
            value={concepto}
            onChange={(e) => setConcepto(e.target.value)}
          />
          <div className="chips-sugerencia">
            {SUGERENCIAS.map((s) => (
              <button type="button" key={s} className="chip-sugerencia" onClick={() => setConcepto(s)}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="field">
            <label htmlFor="ni-cliente">Cliente (opcional)</label>
            <select id="ni-cliente" value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
              <option value="">—</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="ni-fecha">Fecha (vacío = ahora)</label>
            <input id="ni-fecha" type="datetime-local" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
        </div>

        <div className="modal__acciones">
          <button type="button" className="btn btn--primary" onClick={guardar} disabled={enviando}>
            {enviando ? 'Guardando…' : 'Registrar'}
          </button>
          <button type="button" className="btn btn--outline" onClick={onCerrar} disabled={enviando}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
