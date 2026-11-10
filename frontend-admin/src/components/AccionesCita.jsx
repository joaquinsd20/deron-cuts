import { useEffect, useState } from 'react'
import {
  cambiarEstadoCita,
  reprogramarCita,
  registrarPagoCita,
  confirmarAdelantoCita,
  aplicarTardanzaCita,
  eliminarCita,
  urlComprobante,
  mensajeError
} from '../services/api.js'
import { aInputLocal, formatMoney } from '../services/format.js'
import { MetodoSelector, MetodoIcono, nombreMetodo, useMetodosPago } from './MetodoPago.jsx'

/**
 * Todas las acciones sobre una cita (estado, reprogramar, adelanto, cobro, tardanza,
 * eliminar) en un solo lugar, para que Inicio, Calendario y Citas hagan lo mismo.
 * Los formularios se abren en una ventana sobre la pantalla, visible también en celular.
 *
 * Uso:
 *   const { accionesTarjeta, ventana } = useAccionesCita({ alCambiar: recargar, avisar: setToast })
 *   <AppointmentCard cita={c} {...accionesTarjeta} />
 *   {ventana}
 */
export function useAccionesCita({ alCambiar, avisar }) {
  const [modal, setModal] = useState(null) // { tipo, cita }
  const [nuevaFecha, setNuevaFecha] = useState('')
  const [metodo, setMetodo] = useState('EFECTIVO')
  const [monto, setMonto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [captura, setCaptura] = useState(null)
  const metodos = useMetodosPago()
  const preferido = (m) => (metodos.includes(m) ? m : metodos[0])

  const cerrar = () => {
    if (!enviando) setModal(null)
  }

  useEffect(() => {
    if (!modal) return undefined
    const onKey = (e) => e.key === 'Escape' && cerrar()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const ejecutar = async (accion, exito, error) => {
    setEnviando(true)
    try {
      await accion()
      setModal(null)
      if (exito) avisar({ message: exito })
      await alCambiar()
    } catch (err) {
      avisar({ message: mensajeError(err, error), tipo: 'error' })
    } finally {
      setEnviando(false)
    }
  }

  const ETIQUETA_ESTADO = {
    CONFIRMADA: 'Cita confirmada',
    COMPLETADA: 'Cita completada',
    PENDIENTE: 'Cita reabierta',
    CANCELADA: 'Cita cancelada'
  }

  const accionesTarjeta = {
    onEstado: (id, estado) =>
      ejecutar(() => cambiarEstadoCita(id, estado), ETIQUETA_ESTADO[estado], 'No se pudo actualizar la cita'),
    onReprogramar: (cita) => {
      setNuevaFecha(aInputLocal(cita.fechaHoraInicio))
      setModal({ tipo: 'reprogramar', cita })
    },
    onRegistrarPago: (cita) => {
      setMetodo(preferido('EFECTIVO'))
      setMonto(String(cita.saldoPendiente ?? ''))
      setModal({ tipo: 'cobrar', cita })
    },
    onAdelanto: (cita) => {
      setMetodo(cita.metodoAdelanto || preferido('YAPE'))
      setModal({ tipo: 'adelanto', cita })
    },
    onTardanza: (cita) => {
      const aplicar = !cita.tardanzaAplicada
      ejecutar(
        () => aplicarTardanzaCita(cita.id, aplicar),
        aplicar ? 'Tardanza aplicada: se perdió el adelanto y se sumaron S/ 10' : 'Tardanza retirada',
        'No se pudo actualizar la tardanza'
      )
    },
    onEliminar: (cita) => {
      const ok = window.confirm(
        `¿Eliminar la cita de ${cita.nombreCliente}?\n\nSe borra por completo y no se puede deshacer.`
      )
      if (ok) ejecutar(() => eliminarCita(cita.id), 'Cita eliminada', 'No se pudo eliminar la cita')
    },
    onVerPago: (cita) => {
      setCaptura(null)
      setModal({ tipo: 'pago', cita })
      if (cita.comprobanteEnviado) {
        urlComprobante(cita.id)
          .then(setCaptura)
          .catch(() => setCaptura('error'))
      }
    }
  }

  let contenido = null
  const c = modal?.cita

  if (modal?.tipo === 'pago') {
    contenido = (
      <>
        <div className="card__title">Verificar pago del adelanto</div>
        <p className="modal__sub">
          {c.nombreCliente} · {c.nombreServicio} · Adelanto {formatMoney(c.adelantoMonto)}
        </p>
        <div className="pago-reportado">
          <MetodoIcono metodo={c.pagoMetodoReportado} tamano={40} />
          <div>
            <strong>Pagó por {nombreMetodo(c.pagoMetodoReportado)}</strong>
            <span>N.º de operación: {c.pagoOperacion || 'no lo escribió'}</span>
          </div>
        </div>
        {c.comprobanteEnviado &&
          (captura && captura !== 'error' ? (
            <a href={captura} target="_blank" rel="noreferrer" className="captura">
              <img src={captura} alt="Captura del pago enviada por el cliente" />
            </a>
          ) : (
            <p className="hint">{captura === 'error' ? 'No se pudo cargar la captura.' : 'Cargando captura…'}</p>
          ))}
        <p className="hint">Revisa en tu app de Yape/Plin que llegó el monto antes de confirmar.</p>
        <div className="modal__acciones">
          <button
            className="btn btn--pago"
            disabled={enviando}
            onClick={() =>
              ejecutar(
                () => confirmarAdelantoCita(c.id, true, c.pagoMetodoReportado || preferido('YAPE')),
                'Pago confirmado: la cita quedó confirmada y se avisó al cliente',
                'No se pudo confirmar el pago'
              )
            }
          >
            ✓ Llegó, confirmar
          </button>
          <button
            className="btn btn--danger"
            disabled={enviando}
            onClick={() => {
              if (window.confirm('¿No llegó el pago? La cita se cancelará y se liberará el horario.')) {
                ejecutar(() => cambiarEstadoCita(c.id, 'CANCELADA'), 'Cita cancelada', 'No se pudo cancelar')
              }
            }}
          >
            No llegó, cancelar
          </button>
          <button className="btn btn--outline" onClick={cerrar}>
            Cerrar
          </button>
        </div>
      </>
    )
  }

  if (modal?.tipo === 'reprogramar') {
    contenido = (
      <>
        <div className="card__title">Reprogramar</div>
        <p className="modal__sub">
          {c.nombreCliente} · {c.nombreServicio}
        </p>
        <div className="field">
          <label htmlFor="nueva-fecha">Nueva fecha y hora</label>
          <input
            id="nueva-fecha"
            type="datetime-local"
            value={nuevaFecha}
            onChange={(e) => setNuevaFecha(e.target.value)}
          />
        </div>
        <div className="modal__acciones">
          <button
            className="btn btn--primary"
            disabled={!nuevaFecha || enviando}
            onClick={() =>
              ejecutar(() => reprogramarCita(c.id, nuevaFecha), 'Cita reprogramada', 'No se pudo reprogramar la cita')
            }
          >
            {enviando ? 'Guardando…' : 'Guardar'}
          </button>
          <button className="btn btn--outline" onClick={cerrar}>
            Cerrar
          </button>
        </div>
      </>
    )
  }

  if (modal?.tipo === 'adelanto') {
    contenido = (
      <>
        <div className="card__title">Adelanto · {formatMoney(c.adelantoMonto)}</div>
        <p className="modal__sub">
          {c.nombreCliente} · {c.nombreServicio}
        </p>
        {c.adelantoPagado ? (
          <p className="modal__sub metodo-recibido">
            <MetodoIcono metodo={c.metodoAdelanto} tamano={28} />
            Adelanto recibido por {nombreMetodo(c.metodoAdelanto)}
          </p>
        ) : (
          <div className="field">
            <label>¿Cómo te pagó?</label>
            <MetodoSelector valor={metodo} onChange={setMetodo} metodos={metodos} />
          </div>
        )}
        <div className="modal__acciones">
          {c.adelantoPagado ? (
            <button
              className="btn btn--danger"
              disabled={enviando}
              onClick={() =>
                ejecutar(
                  () => confirmarAdelantoCita(c.id, false, metodo),
                  'Adelanto marcado como pendiente',
                  'No se pudo actualizar el adelanto'
                )
              }
            >
              Quitar adelanto
            </button>
          ) : (
            <button
              className="btn btn--pago"
              disabled={enviando}
              onClick={() =>
                ejecutar(
                  () => confirmarAdelantoCita(c.id, true, metodo),
                  'Adelanto registrado y cita confirmada',
                  'No se pudo registrar el adelanto'
                )
              }
            >
              {enviando ? 'Guardando…' : 'Confirmar adelanto'}
            </button>
          )}
          <button className="btn btn--outline" onClick={cerrar}>
            Cerrar
          </button>
        </div>
      </>
    )
  }

  if (modal?.tipo === 'cobrar') {
    const confirmar = () => {
      const payload = { metodoPago: metodo }
      const n = Number(monto)
      if (monto && (Number.isNaN(n) || n <= 0)) {
        avisar({ message: 'Monto inválido', tipo: 'error' })
        return
      }
      if (monto) payload.monto = n
      ejecutar(
        () => registrarPagoCita(c.id, payload),
        `Pago de ${formatMoney(payload.monto ?? c.saldoPendiente)} registrado`,
        'No se pudo registrar el pago'
      )
    }
    contenido = (
      <>
        <div className="card__title">Cobrar saldo</div>
        <p className="modal__sub">
          {c.nombreCliente} · Total {formatMoney(c.totalAPagar)} · Saldo {formatMoney(c.saldoPendiente)}
        </p>
        <div className="field">
          <label>¿Cómo te pagó?</label>
          <MetodoSelector valor={metodo} onChange={setMetodo} metodos={metodos} />
        </div>
        <div className="field">
          <label htmlFor="monto-pago">Monto (vacío = saldo pendiente)</label>
          <input
            id="monto-pago"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
          />
        </div>
        <div className="modal__acciones">
          <button className="btn btn--pago" disabled={enviando} onClick={confirmar}>
            {enviando ? 'Guardando…' : 'Registrar pago'}
          </button>
          <button className="btn btn--outline" onClick={cerrar}>
            Cerrar
          </button>
        </div>
      </>
    )
  }

  const ventana = contenido ? (
    <div className="modal" role="presentation" onClick={cerrar}>
      <div className="modal__panel" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        {contenido}
      </div>
    </div>
  ) : null

  return { accionesTarjeta, ventana }
}
