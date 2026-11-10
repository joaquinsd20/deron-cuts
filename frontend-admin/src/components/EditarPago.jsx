import { useState } from 'react'
import { editarPago, mensajeError } from '../services/api.js'
import { MetodoSelector } from './MetodoPago.jsx'

const TITULOS = { ADELANTO: 'Editar adelanto', SALDO: 'Editar cobro del saldo', MANUAL: 'Editar ingreso' }

/** Corrige monto, método, fecha (y concepto si es manual) de un movimiento del historial. */
export default function EditarPago({ pago, metodos, onCerrar, onGuardado, avisar }) {
  const [monto, setMonto] = useState(String(pago.montoPagado ?? ''))
  const [metodo, setMetodo] = useState(metodos.includes(pago.metodoPago) ? pago.metodoPago : metodos[0])
  const [fecha, setFecha] = useState(pago.fechaPago ? String(pago.fechaPago).slice(0, 16) : '')
  const [concepto, setConcepto] = useState(pago.concepto === 'MANUAL' ? pago.nombreServicio || '' : '')
  const [enviando, setEnviando] = useState(false)
  const esManual = pago.concepto === 'MANUAL'

  const guardar = async () => {
    const n = Number(monto)
    if (!n || n <= 0) return avisar({ message: 'Escribe un monto mayor a cero', tipo: 'error' })
    if (esManual && !concepto.trim()) return avisar({ message: 'Escribe el concepto', tipo: 'error' })
    setEnviando(true)
    try {
      await editarPago(pago.id, {
        monto: n,
        metodo,
        fecha: fecha ? `${fecha}:00` : null,
        concepto: esManual ? concepto.trim() : null
      })
      avisar({ message: 'Pago actualizado' })
      onGuardado?.()
      onCerrar()
    } catch (err) {
      avisar({ message: mensajeError(err, 'No se pudo actualizar el pago'), tipo: 'error' })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="modal" role="presentation" onClick={() => !enviando && onCerrar()}>
      <div className="modal__panel" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="card__title">{TITULOS[pago.concepto] || 'Editar pago'}</div>
        <p className="modal__sub">
          {pago.nombreCliente}
          {!esManual && pago.nombreServicio ? ` · ${pago.nombreServicio}` : ''}
        </p>

        <div className="field">
          <label htmlFor="ep-monto">Monto (S/)</label>
          <input
            id="ep-monto"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.50"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
          />
        </div>

        <div className="field">
          <label>¿Cómo te pagaron?</label>
          <MetodoSelector valor={metodo} onChange={setMetodo} metodos={metodos} />
        </div>

        {esManual && (
          <div className="field">
            <label htmlFor="ep-concepto">Concepto</label>
            <input
              id="ep-concepto"
              maxLength={120}
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
            />
          </div>
        )}

        <div className="field">
          <label htmlFor="ep-fecha">Fecha del pago</label>
          <input id="ep-fecha" type="datetime-local" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>

        <div className="modal__acciones">
          <button type="button" className="btn btn--primary" onClick={guardar} disabled={enviando}>
            {enviando ? 'Guardando…' : 'Guardar cambios'}
          </button>
          <button type="button" className="btn btn--outline" onClick={onCerrar} disabled={enviando}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
